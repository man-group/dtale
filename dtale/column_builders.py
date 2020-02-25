import numpy as np
import pandas as pd

import dtale.global_state as global_state


class ColumnBuilder(object):

    def __init__(self, data_id, column_type, name, cfg):
        self.data_id = data_id
        if column_type == 'numeric':
            self.builder = NumericColumnBuilder(name, cfg)
        elif column_type == 'datetime':
            self.builder = DatetimeColumnBuilder(name, cfg)
        elif column_type == 'bins':
            self.builder = BinsColumnBuilder(name, cfg)
        else:
            raise NotImplementedError('{} column builder not implemented yet!'.format(column_type))

    def build_column(self):
        data = global_state.get_data(self.data_id)
        return self.builder.build_column(data)

    def build_code(self):
        return self.builder.build_code()


class NumericColumnBuilder(object):

    def __init__(self, name, cfg):
        self.name = name
        self.cfg = cfg

    def build_column(self, data):
        left, right, operation = (self.cfg.get(p) for p in ['left', 'right', 'operation'])
        left = data[left['col']] if 'col' in left else float(left['val'])
        right = data[right['col']] if 'col' in right else float(right['val'])
        if operation == 'sum':
            return left + right
        if operation == 'difference':
            return left - right
        if operation == 'multiply':
            return left * right
        if operation == 'divide':
            return left / right
        return np.nan

    def build_code(self):
        left, right, operation = (self.cfg.get(p) for p in ['left', 'right', 'operation'])
        operations = dict(sum='+', difference='-', multiply='*', divide='/')
        return "df.loc[:, '{name}'] = {left} {operation} {right}".format(
            name=self.name,
            operation=operations.get(operation),
            left="df['{}']".format(left['col']) if 'col' in left else left['val'],
            right="df['{}']".format(right['col']) if 'col' in right else right['val']
        )


FREQ_MAPPING = dict(month='M', quarter='Q', year='Y')


class DatetimeColumnBuilder(object):

    def __init__(self, name, cfg):
        self.name = name
        self.cfg = cfg

    def build_column(self, data):
        col = self.cfg['col']
        if 'property' in self.cfg:
            return getattr(data[col].dt, self.cfg['property'])
        conversion_key = self.cfg['conversion']
        [freq, how] = conversion_key.split('_')
        freq = FREQ_MAPPING[freq]
        conversion_data = data[[col]].set_index(col).index.to_period(freq).to_timestamp(how=how).normalize()
        return pd.Series(conversion_data, index=data.index, name=self.name)

    def build_code(self):
        if 'property' in self.cfg:
            return "df.loc[:, '{name}'] = df['{col}'].dt.{property}".format(name=self.name, **self.cfg)
        conversion_key = self.cfg['conversion']
        [freq, how] = conversion_key.split('_')
        freq = FREQ_MAPPING[freq]
        return (
            "{name}_data = data[['{col}']].set_index('{col}').index.to_period('{freq}')'"
            ".to_timestamp(how='{how}').normalize()\n"
            "df.loc[:, '{name}'] = pd.Series({name}_data, index=df.index, name='{name}')"
        ).format(name=self.name, col=self.cfg['col'], freq=freq, how=how)


class BinsColumnBuilder(object):

    def __init__(self, name, cfg):
        self.name = name
        self.cfg = cfg

    def build_column(self, data):
        col, operation, bins, labels = (self.cfg.get(p) for p in ['col', 'operation', 'bins', 'labels'])
        bins = int(bins)
        if operation == 'cut':
            bin_data = pd.cut(data[col], bins=bins)
        else:
            bin_data = pd.qcut(data[col], q=bins)
        if labels:
            cats = {idx: str(cat) for idx, cat in enumerate(labels.split(','))}
        else:
            cats = {idx: str(cat) for idx, cat in enumerate(bin_data.cat.categories)}
        return pd.Series(bin_data.cat.codes.map(cats), index=data.index, name=self.name)

    def build_code(self):
        col, operation, bins, labels = (self.cfg.get(p) for p in ['col', 'operation', 'bins', 'labels'])
        bins_code = []
        if operation == 'cut':
            bins_code.append("{name}_data = pd.cut(df['{col}'], bins={bins})".format(
                name=self.name, col=col, bins=bins
            ))
        else:
            bins_code.append("{name}_data = pd.qcut(df['{col}'], bins={bins})".format(
                name=self.name, col=col, bins=bins
            ))
        if labels:
            labels_str = ', '.join(['{}: {}'.format(idx, cat) for idx, cat in enumerate(labels.split(','))])
            labels_str = '{' + labels_str + '}'
            bins_code.append('{name}_cats = {labels}'.format(name=self.name, labels=labels_str))
        else:
            bins_code.append(
                '{name}_cats = {idx: str(cat) for idx, cat in enumerate({name}_data.cat.categories)}'
            )
        s_str = "df.loc[:, '{name}'] = pd.Series({name}_data.cat.codes.map({name}_cats), index=df.index, name='{name}')"
        bins_code.append(s_str.format(name=self.name))
        return '\n'.join(bins_code)
