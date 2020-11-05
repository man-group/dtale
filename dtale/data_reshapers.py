import pandas as pd

import dtale.global_state as global_state
from dtale.query import run_query
from dtale.utils import make_list


def flatten_columns(df, columns=None):
    if columns is not None:
        return [
            " ".join(
                [
                    "{}-{}".format(c1, str(c2))
                    for c1, c2 in zip(make_list(columns), make_list(col_val))
                ]
            ).strip()
            for col_val in df.columns.values
        ]
    return [
        " ".join([str(c) for c in make_list(col)]).strip() for col in df.columns.values
    ]


class DataReshaper(object):
    def __init__(self, data_id, shape_type, cfg):
        self.data_id = data_id
        if shape_type == "pivot":
            self.builder = PivotBuilder(cfg)
        elif shape_type == "aggregate":
            self.builder = AggregateBuilder(cfg)
        elif shape_type == "transpose":
            self.builder = TransposeBuilder(cfg)
        else:
            raise NotImplementedError(
                "{} data re-shaper not implemented yet!".format(shape_type)
            )

    def reshape(self):
        data = run_query(
            global_state.get_data(self.data_id),
            (global_state.get_settings(self.data_id) or {}).get("query"),
            global_state.get_context_variables(self.data_id),
        )
        return self.builder.reshape(data)

    def build_code(self):
        return self.builder.build_code()


class PivotBuilder(object):
    def __init__(self, cfg):
        self.cfg = cfg

    def reshape(self, data):
        index, columns, values, aggfunc = (
            self.cfg.get(p) for p in ["index", "columns", "values", "aggfunc"]
        )
        pivot_data = pd.pivot_table(
            data, values=values, index=index, columns=columns, aggfunc=aggfunc
        )
        if len(values) == 1:
            pivot_data.columns = pivot_data.columns.droplevel(0)
        if self.cfg.get("columnNameHeaders", False):
            pivot_data.columns = flatten_columns(pivot_data, columns=columns)
        else:
            pivot_data.columns = flatten_columns(pivot_data)
        pivot_data = pivot_data.rename_axis(None, axis=1)
        return pivot_data

    def build_code(self):
        index, columns, values, aggfunc = (
            self.cfg.get(p) for p in ["index", "columns", "values", "aggfunc"]
        )
        code = []
        if aggfunc is not None or len(values) > 1:
            code.append(
                "df = pd.pivot_table(df, index='{}', columns='{}', values=['{}'], aggfunc='{}')".format(
                    index, columns, "', '".join(values), aggfunc
                )
            )
            if len(values) > 1:
                code.append(
                    "df.columns = [' '.join([str(c) for c in col]).strip() for col in df.columns.values]"
                )
            elif len(values) == 1:
                code.append("df.columns = df.columns.droplevel(0)")
        else:
            code.append(
                "df = df.pivot(index='{index}', columns='{columns}', values='{values}')".format(
                    index=index, columns=columns, values=values[0]
                )
            )
        code.append("df = df.rename_axis(None, axis=1)")
        return "\n".join(code)


class AggregateBuilder(object):
    def __init__(self, cfg):
        self.cfg = cfg

    def reshape(self, data):
        index, agg = (self.cfg.get(p) for p in ["index", "agg"])
        agg_data = data.groupby(index)
        agg_type, func, cols = (agg.get(p) for p in ["type", "func", "cols"])
        if agg_type == "func":
            if cols:
                agg_data = agg_data[cols]
            return getattr(agg_data, func)()
        agg_data = agg_data.aggregate(cols)
        agg_data.columns = flatten_columns(agg_data)
        return agg_data

    def build_code(self):
        index, agg = (self.cfg.get(p) for p in ["index", "agg"])
        index = "', '".join(index)
        agg_type, func, cols = (agg.get(p) for p in ["type", "func", "cols"])
        if agg_type == "func":
            if cols is not None:
                return "df = df.groupby(['{index}'])['{columns}'].{agg}()".format(
                    index=index, columns="', '".join(cols), agg=agg
                )
            return "df = df.groupby(['{index}']).{agg}()".format(
                index="', '".join(index), agg=agg
            )
        code = [
            "df = df.groupby(['{index}']).aggregate(".format(index=index) + "{",
            ",\n".join(
                "\t'{col}': ['{aggs}']".format(col=col, aggs="', '".join(aggs))
                for col, aggs in cols.items()
            ),
            "})",
            "df.columns = [' '.join([str(c) for c in col]).strip() for col in df.columns.values]",
        ]
        return "\n".join(code)


class TransposeBuilder(object):
    def __init__(self, cfg):
        self.cfg = cfg

    def reshape(self, data):
        index, columns = (self.cfg.get(p) for p in ["index", "columns"])
        t_data = data.set_index(index)
        if any(t_data.index.duplicated()):
            raise Exception(
                "Transposed data contains duplicates, please specify additional index or filtering"
            )
        if columns is not None:
            t_data = t_data[columns]
        t_data = t_data.T
        if len(index) > 1:
            t_data.columns = flatten_columns(t_data)
        t_data = t_data.rename_axis(None, axis=1)
        return t_data

    def build_code(self):
        index, columns = (self.cfg.get(p) for p in ["index", "columns"])

        code = []
        if columns is not None:
            code.append(
                "df = df.set_index('{}')['{}'].T".format(
                    "', '".join(index), "', '".join(columns)
                )
            )
        else:
            code.append("df = df.set_index('{}').T".format("', '".join(index)))
        if len(index) > 1:
            code.append(
                "df.columns = [' '.join([str(c) for c in col]).strip() for col in df.columns.values]"
            )
        code.append("df = df.rename_axis(None, axis=1)")
        return "\n".join(code)
