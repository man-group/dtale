import json

import dtale.global_state as global_state
from dtale.utils import classify_type, find_dtype, make_list


class ColumnFilter(object):

    def __init__(self, data_id, column, cfg):
        self.data_id = data_id
        self.column = column
        s = global_state.get_data(data_id)[column]
        dtype = find_dtype(s)
        self.classification = classify_type(dtype)
        self.cfg = cfg
        if self.cfg is not None:
            self.cfg = json.loads(self.cfg)
        if self.cfg['type'] == 'string':
            self.builder = StringFilter(column, self.classification, self.cfg)
        if self.cfg['type'] in ['int', 'float']:
            self.builder = NumericFilter(column, self.classification, self.cfg)
        if self.cfg['type'] == 'date':
            self.builder = DateFilter(column, self.classification, self.cfg)
        if self.cfg['type'] == 'outliers':
            self.builder = OutlierFilter(column, self.classification, self.cfg)

    def save_filter(self):
        curr_settings = global_state.get_settings(self.data_id)
        filters_key = '{}Filters'.format('outlier' if self.cfg['type'] == 'outliers' else 'column')
        curr_filters = curr_settings.get(filters_key) or {}
        fltr = self.builder.build_filter()
        if fltr is None:
            curr_filters.pop(self.column, None)
        else:
            curr_filters[self.column] = fltr
        curr_settings[filters_key] = curr_filters
        global_state.set_settings(self.data_id, curr_settings)
        return curr_filters


class OutlierFilter(object):
    def __init__(self, column, classification, cfg):
        self.column = column
        self.classification = classification
        self.cfg = cfg

    def build_filter(self):
        if self.cfg.get("query") is None:
            return None
        return self.cfg


class MissingFilter(object):
    def __init__(self, column, classification, cfg):
        self.column = column
        self.classification = classification
        self.cfg = cfg

    def handle_missing(self, fltr):
        if self.cfg is None or not self.cfg.get('missing', False):
            return fltr
        return {'missing': True, 'query': '{col} != {col}'.format(col=self.column)}


class StringFilter(MissingFilter):

    def __init__(self, column, classification, cfg):
        super(StringFilter, self).__init__(column, classification, cfg)

    def build_filter(self):
        if self.cfg is None or not len(self.cfg.get('value', [])):
            return super(StringFilter, self).handle_missing(None)

        state = self.cfg.get('value', [])
        operand = self.cfg.get('operand', '=')
        fltr = dict(value=state)
        if len(state) == 1:
            val_str = ("'{}'" if self.classification == 'S' else '{}').format(state[0])
            fltr['query'] = "{} {} {}".format(self.column, '==' if operand == '=' else '!=', val_str)
        else:
            val_str = ("'{}'".format("', '".join(state)) if self.classification == 'S' else ','.join(state))
            fltr['query'] = "{} {} ({})".format(self.column, 'in' if operand == '=' else 'not in', val_str)
        return super(StringFilter, self).handle_missing(fltr)


class NumericFilter(MissingFilter):

    def __init__(self, column, classification, cfg):
        super(NumericFilter, self).__init__(column, classification, cfg)

    def build_filter(self):
        if self.cfg is None:
            return super(NumericFilter, self).handle_missing(None)
        cfg_val, cfg_operand, cfg_min, cfg_max = (self.cfg.get(p) for p in ['value', 'operand', 'min', 'max'])

        if cfg_operand in ['=', 'ne']:
            state = make_list(cfg_val or [])
            if not len(state):
                return super(NumericFilter, self).handle_missing(None)
            fltr = dict(value=cfg_val, operand=cfg_operand)
            if len(state) == 1:
                fltr['query'] = "{} {} {}".format(self.column, '==' if cfg_operand == '=' else '!=', state[0])
            else:
                fltr['query'] = "{} {} ({})".format(
                    self.column, 'in' if cfg_operand == '=' else 'not in', ", ".join(state)
                )
            return super(NumericFilter, self).handle_missing(fltr)
        if cfg_operand in ['<', '>', '<=', '>=']:
            if cfg_val is None:
                return super(NumericFilter, self).handle_missing(None)
            fltr = dict(value=cfg_val, operand=cfg_operand, query='{} {} {}'.format(self.column, cfg_operand, cfg_val))
            return super(NumericFilter, self).handle_missing(fltr)
        if cfg_operand in ['[]', '()']:
            fltr = dict(operand=cfg_operand)
            queries = []
            if cfg_min is not None:
                fltr['min'] = cfg_min
                queries.append('{} >{} {}'.format(self.column, '=' if cfg_operand == '[]' else '', cfg_min))
            if cfg_max is not None:
                fltr['max'] = cfg_max
                queries.append('{} <{} {}'.format(self.column, '=' if cfg_operand == '[]' else '', cfg_max))
            if len(queries) == 2 and cfg_max == cfg_min:
                queries = ["{} == {}".format(self.column, cfg_max)]
            if not len(queries):
                return super(NumericFilter, self).handle_missing(None)
            fltr['query'] = ' and '.join(queries)
            return super(NumericFilter, self).handle_missing(fltr)
        return super(NumericFilter, self).handle_missing(None)


class DateFilter(MissingFilter):

    def __init__(self, column, classification, cfg):
        super(DateFilter, self).__init__(column, classification, cfg)

    def build_filter(self):
        if self.cfg is None:
            return super(DateFilter, self).handle_missing(None)

        start, end = (self.cfg.get(p) for p in ['start', 'end'])
        fltr = dict(start=start, end=end)
        queries = []
        if start:
            queries.append("{} >= '{}'".format(self.column, start))
        if end:
            queries.append("{} <= '{}'".format(self.column, end))
        if len(queries) == 2 and start == end:
            queries = ["{} == '{}'".format(self.column, start)]
        if not len(queries):
            return super(DateFilter, self).handle_missing(None)
        fltr['query'] = ' and '.join(queries)
        return super(DateFilter, self).handle_missing(fltr)
