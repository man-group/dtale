import random
import string
import time

import numpy as np
import pandas as pd
from scipy.stats import mstats
from six import string_types

import dtale.global_state as global_state
from dtale.utils import classify_type


class ColumnBuilder(object):
    def __init__(self, data_id, column_type, name, cfg):
        self.data_id = data_id
        if column_type == "numeric":
            self.builder = NumericColumnBuilder(name, cfg)
        elif column_type == "datetime":
            self.builder = DatetimeColumnBuilder(name, cfg)
        elif column_type == "bins":
            self.builder = BinsColumnBuilder(name, cfg)
        elif column_type == "random":
            self.builder = RandomColumnBuilder(name, cfg)
        elif column_type == "type_conversion":
            self.builder = TypeConversionColumnBuilder(name, cfg)
        elif column_type == "transform":
            self.builder = TransformColumnBuilder(name, cfg)
        elif column_type == "winsorize":
            self.builder = WinsorizeColumnBuilder(name, cfg)
        elif column_type == "zscore_normalize":
            self.builder = ZScoreNormalizeColumnBuilder(name, cfg)
        else:
            raise NotImplementedError(
                "'{}' column builder not implemented yet!".format(column_type)
            )

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
        left, right, operation = (
            self.cfg.get(p) for p in ["left", "right", "operation"]
        )
        left = data[left["col"]] if "col" in left else float(left["val"])
        right = data[right["col"]] if "col" in right else float(right["val"])
        if operation == "sum":
            return left + right
        if operation == "difference":
            return left - right
        if operation == "multiply":
            return left * right
        if operation == "divide":
            return left / right
        return np.nan

    def build_code(self):
        left, right, operation = (
            self.cfg.get(p) for p in ["left", "right", "operation"]
        )
        operations = dict(sum="+", difference="-", multiply="*", divide="/")
        return "df.loc[:, '{name}'] = {left} {operation} {right}".format(
            name=self.name,
            operation=operations.get(operation),
            left="df['{}']".format(left["col"]) if "col" in left else left["val"],
            right="df['{}']".format(right["col"]) if "col" in right else right["val"],
        )


FREQ_MAPPING = dict(month="M", quarter="Q", year="Y")


class DatetimeColumnBuilder(object):
    def __init__(self, name, cfg):
        self.name = name
        self.cfg = cfg

    def build_column(self, data):
        col = self.cfg["col"]
        if "property" in self.cfg:
            return getattr(data[col].dt, self.cfg["property"])
        conversion_key = self.cfg["conversion"]
        [freq, how] = conversion_key.split("_")
        freq = FREQ_MAPPING[freq]
        conversion_data = (
            data[[col]]
            .set_index(col)
            .index.to_period(freq)
            .to_timestamp(how=how)
            .normalize()
        )
        return pd.Series(conversion_data, index=data.index, name=self.name)

    def build_code(self):
        if "property" in self.cfg:
            return "df.loc[:, '{name}'] = df['{col}'].dt.{property}".format(
                name=self.name, **self.cfg
            )
        conversion_key = self.cfg["conversion"]
        [freq, how] = conversion_key.split("_")
        freq = FREQ_MAPPING[freq]
        return (
            "{name}_data = data[['{col}']].set_index('{col}').index.to_period('{freq}')'"
            ".to_timestamp(how='{how}').normalize()\n"
            "df.loc[:, '{name}'] = pd.Series({name}_data, index=df.index, name='{name}')"
        ).format(name=self.name, col=self.cfg["col"], freq=freq, how=how)


class BinsColumnBuilder(object):
    def __init__(self, name, cfg):
        self.name = name
        self.cfg = cfg

    def build_column(self, data):
        col, operation, bins, labels = (
            self.cfg.get(p) for p in ["col", "operation", "bins", "labels"]
        )
        bins = int(bins)
        if operation == "cut":
            bin_data = pd.cut(data[col], bins=bins)
        else:
            bin_data = pd.qcut(data[col], q=bins)
        if labels:
            cats = {idx: str(cat) for idx, cat in enumerate(labels.split(","))}
        else:
            cats = {idx: str(cat) for idx, cat in enumerate(bin_data.cat.categories)}
        return pd.Series(bin_data.cat.codes.map(cats), index=data.index, name=self.name)

    def build_test(self, data):
        col, operation, bins, labels = (
            self.cfg.get(p) for p in ["col", "operation", "bins", "labels"]
        )
        bins = int(bins)
        if operation == "cut":
            bin_data = pd.cut(data[col], bins=bins)
        else:
            bin_data = pd.qcut(data[col], q=bins)
        counts = [int(c) for c in bin_data.groupby(bin_data.cat.codes).count().values]
        if labels:
            labels = labels.split(",")
        else:
            labels = list(map(str, bin_data.cat.categories))
        return counts, labels

    def build_code(self):
        col, operation, bins, labels = (
            self.cfg.get(p) for p in ["col", "operation", "bins", "labels"]
        )
        bins_code = []
        if operation == "cut":
            bins_code.append(
                "{name}_data = pd.cut(df['{col}'], bins={bins})".format(
                    name=self.name, col=col, bins=bins
                )
            )
        else:
            bins_code.append(
                "{name}_data = pd.qcut(df['{col}'], bins={bins})".format(
                    name=self.name, col=col, bins=bins
                )
            )
        if labels:
            labels_str = ", ".join(
                ["{}: {}".format(idx, cat) for idx, cat in enumerate(labels.split(","))]
            )
            labels_str = "{" + labels_str + "}"
            bins_code.append(
                "{name}_cats = {labels}".format(name=self.name, labels=labels_str)
            )
        else:
            bins_code.append(
                "{name}_cats = {idx: str(cat) for idx, cat in enumerate({name}_data.cat.categories)}"
            )
        s_str = "df.loc[:, '{name}'] = pd.Series({name}_data.cat.codes.map({name}_cats), index=df.index, name='{name}')"
        bins_code.append(s_str.format(name=self.name))
        return "\n".join(bins_code)


def id_generator(size=10, chars=string.ascii_uppercase + string.digits):
    return "".join(random.choice(chars) for _ in range(int(size)))


class RandomColumnBuilder(object):
    def __init__(self, name, cfg):
        self.name = name
        self.cfg = cfg

    def build_column(self, data):
        rand_type = self.cfg["type"]
        if "string" == rand_type:
            kwargs = dict(size=self.cfg.get("length", 10))
            if self.cfg.get("chars"):
                kwargs["chars"] = self.cfg["chars"]
            return pd.Series(
                [id_generator(**kwargs) for _ in range(len(data))],
                index=data.index,
                name=self.name,
            )
        if "int" == rand_type:
            low = self.cfg.get("low", 0)
            high = self.cfg.get("high", 100)
            return pd.Series(
                np.random.randint(low, high=high, size=len(data)),
                index=data.index,
                name=self.name,
            )
        if "date" == rand_type:
            start = pd.Timestamp(self.cfg.get("start") or "19000101")
            end = pd.Timestamp(self.cfg.get("end") or "21991231")
            business_days = self.cfg.get("businessDay") is True
            timestamps = self.cfg.get("timestamps") is True
            if timestamps:

                def pp(start, end, n):
                    start_u = start.value // 10 ** 9
                    end_u = end.value // 10 ** 9
                    return pd.DatetimeIndex(
                        (10 ** 9 * np.random.randint(start_u, end_u, n)).view("M8[ns]")
                    )

                dates = pp(pd.Timestamp(start), pd.Timestamp(end), len(data))
            else:
                dates = pd.date_range(start, end, freq="B" if business_days else "D")
                dates = [
                    dates[i]
                    for i in np.random.randint(0, len(dates) - 1, size=len(data))
                ]
            return pd.Series(dates, index=data.index, name=self.name)
        if "bool" == rand_type:
            return pd.Series(
                np.random.choice([True, False], len(data)),
                index=data.index,
                name=self.name,
            )
        if "choice" == rand_type:
            choices = (
                self.cfg.get("choices")
                or "a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z"
            )
            choices = choices.split(",")
            return pd.Series(
                np.random.choice(choices, len(data)), index=data.index, name=self.name
            )

        # floats
        low = self.cfg.get("low", 0)
        high = self.cfg.get("high", 1)
        return pd.Series(
            np.random.uniform(low, high, len(data)), index=data.index, name=self.name
        )

    def build_code(self):
        rand_type = self.cfg["type"]
        if "string" == rand_type:
            kwargs = []
            if self.cfg.get("length") != 10:
                kwargs.append("size={size}".format(size=self.cfg.get("length")))
            if self.cfg.get("chars"):
                kwargs.append("chars='{chars}'".format(chars=self.cfg.get("chars")))
            kwargs = ", ".join(kwargs)
            return (
                "import number\nimport random\n\n"
                "def id_generator(size=1500, chars=string.ascii_uppercase + string.digits):\n"
                "\treturn ''.join(random.choice(chars) for _ in range(size))\n\n"
                "df.loc[:, '{name}'] = pd.Series([id_generator({kwargs}) for _ in range(len(df)], index=df.index)"
            ).format(kwargs=kwargs, name=self.name)
            return "df.loc[:, '{name}'] = df['{col}'].dt.{property}".format(
                name=self.name, **self.cfg
            )

        if "bool" == rand_type:
            return (
                "df.loc[:, '{name}'] = pd.Series(np.random.choice([True, False], len(df)), index=data.index"
            ).format(name=self.name)
        if "date" == rand_type:
            start = pd.Timestamp(self.cfg.get("start") or "19000101")
            end = pd.Timestamp(self.cfg.get("end") or "21991231")
            business_days = self.cfg.get("businessDay") is True
            timestamps = self.cfg.get("timestamps") is True
            if timestamps:
                code = (
                    "def pp(start, end, n):\n"
                    "\tstart_u = start.value // 10 ** 9\n"
                    "\tend_u = end.value // 10 ** 9\n"
                    "\treturn pd.DatetimeIndex(\n"
                    "\t\t(10 ** 9 * np.random.randint(start_u, end_u, n, dtype=np.int64)).view('M8[ns]')\n"
                    ")\n\n"
                    "df.loc[:, '{name}'] = pd.Series(\n"
                    "\tpp(pd.Timestamp('{start}'), pd.Timestamp('{end}'), len(df)), index=df.index\n"
                    ")"
                ).format(
                    name=self.name,
                    start=start.strftime("%Y%m%d"),
                    end=end.strftime("%Y%m%d"),
                )
            else:
                freq = ", freq='B'" if business_days else ""
                code = (
                    "dates = pd.date_range('{start}', '{end}'{freq})\n"
                    "dates = [dates[i] for i in np.random.randint(0, len(dates) - 1, size=len(data))]\n"
                    "df.loc[:, '{name}'] = pd.Series(dates, index=data.index)"
                ).format(
                    name=self.name,
                    start=start.strftime("%Y%m%d"),
                    end=end.strftime("%Y%m%d"),
                    freq=freq,
                )
            return code
        if "choice" == rand_type:
            choices = (
                self.cfg.get("choices")
                or "a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z"
            )
            choices = choices.split(",")
            return "df.loc[:, '{name}'] = pd.Series(np.random.choice({choices}, len(df)), index=df.index)".format(
                choices="', '".join(choices), name=self.name
            )

        if "int" == rand_type:
            low = self.cfg.get("low", 0)
            high = self.cfg.get("high", 100)
            return (
                "import numpy as np\n\n"
                "df.loc[:, '{name}'] = pd.Series(np.random.randint({low}, high={high}, size=len(df)), "
                "index=df.index)"
            ).format(name=self.name, low=low, high=high)

        low = self.cfg.get("low", 0)
        high = self.cfg.get("high", 1)
        return (
            "import numpy as np\n\n"
            "df.loc[:, '{name}'] = pd.Series(np.random.uniform({low}, {high}, len(df)), index=df.index)"
        ).format(low=low, high=high, name=self.name)


class TypeConversionColumnBuilder(object):
    def __init__(self, name, cfg):
        self.name = name
        self.cfg = cfg

    def build_column(self, data):
        col, from_type, to_type = (self.cfg.get(p) for p in ["col", "from", "to"])
        s = data[col]
        classifier = classify_type(from_type)
        if (
            classifier == "S"
        ):  # col can be (str or category) -> date, int, float, bool, category
            if to_type == "date":
                date_kwargs = {}
                if self.cfg.get("fmt"):
                    date_kwargs["format"] = self.cfg["fmt"]
                else:
                    date_kwargs["infer_datetime_format"] = True
                return pd.Series(
                    pd.to_datetime(s, **date_kwargs), name=self.name, index=s.index
                )
            elif to_type == "int":
                return pd.Series(
                    s.astype("float").astype("int"), name=self.name, index=s.index
                )
            elif to_type == "float":
                return pd.Series(
                    pd.to_numeric(s, errors="coerce"), name=self.name, index=s.index
                )
            else:
                if from_type.startswith("mixed"):
                    if to_type == "float":
                        return pd.Series(
                            pd.to_numeric(s, errors="coerce"),
                            name=self.name,
                            index=s.index,
                        )
                    elif to_type == "bool":

                        def _process_mixed_bool(v):
                            if isinstance(v, bool):
                                return v
                            if isinstance(v, string_types):
                                return dict(true=True, false=False).get(
                                    v.lower(), np.nan
                                )
                            return np.nan

                        return pd.Series(
                            s.apply(_process_mixed_bool), name=self.name, index=s.index
                        )
                return pd.Series(s.astype(to_type), name=self.name, index=s.index)
        elif classifier == "I":  # date, float, category, str, bool
            if to_type == "date":
                unit = self.cfg.get("unit") or "D"
                if unit == "YYYYMMDD":
                    return pd.Series(
                        s.astype(str).apply(pd.Timestamp), name=self.name, index=s.index
                    )
                return pd.Series(
                    pd.to_datetime(s, unit=unit), name=self.name, index=s.index
                )
            return pd.Series(s.astype(to_type), name=self.name, index=s.index)
        elif classifier == "F":  # str, int
            return pd.Series(s.astype(to_type), name=self.name, index=s.index)
        elif classifier == "D":  # str, int
            if to_type == "int":
                unit = self.cfg.get("unit")
                if unit == "YYYYMMDD":
                    return pd.Series(
                        s.dt.strftime("%Y%m%d").astype(int),
                        name=self.name,
                        index=s.index,
                    )
                return pd.Series(
                    s.apply(lambda x: time.mktime(x.timetuple())).astype(int)
                )
            return pd.Series(
                s.dt.strftime(self.cfg.get("fmt") or "%Y%m%d"),
                name=self.name,
                index=s.index,
            )
        elif classifier == "B":
            return pd.Series(s.astype(to_type), name=self.name, index=s.index)
        raise NotImplementedError(
            "data type conversion not supported for dtype: {}".format(from_type)
        )

    def build_inner_code(self):
        col, from_type, to_type = (self.cfg.get(p) for p in ["col", "from", "to"])
        s = "df['{col}']".format(col=col)
        classifier = classify_type(from_type)
        if classifier == "S":  # date, int, float, bool, category
            if to_type == "date":
                if self.cfg.get("fmt"):
                    date_kwargs = "format='{}'".format(self.cfg["fmt"])
                else:
                    date_kwargs = "infer_datetime_format=True"
                code = "pd.Series(pd.to_datetime({s}, {kwargs}), name='{name}', index={s}.index)"
                return code.format(s=s, name=self.name, kwargs=date_kwargs)
            elif to_type == "int":
                return "pd.Series({s}.astype('float').astype('int'), name='{name}', index={s}.index)".format(
                    s=s, name=self.name
                )
            elif to_type == "float":
                return "pd.Series(pd.to_numeric({s}, errors='coerce'), name='{name}', index={s}.index)".format(
                    s=s, name=self.name
                )
            else:
                if from_type.startswith("mixed"):
                    if to_type == "float":
                        return "pd.Series(pd.to_numeric({s}, errors='coerce'), name='{name}', index={s}.index)".format(
                            s=s, name=self.name
                        )
                    elif to_type == "bool":
                        return (
                            "def _process_mixed_bool(v):\n"
                            "from six import string_types\n\n"
                            "\tif isinstance(v, bool):\n"
                            "\t\treturn v\n"
                            "\tif isinstance(v, string_types):\n"
                            "\t\treturn dict(true=True, false=False).get(v.lower(), np.nan)\n"
                            "\treturn np.nan\n\n"
                            "pd.Series({s}.apply(_process_mixed_bool), name='{name}', index={s}.index)"
                        ).format(s=s, name=self.name)
                return "pd.Series({s}.astype({to_type}), name='{name}', index={s}.index)".format(
                    s=s, to_type=to_type, name=self.name
                )
        elif classifier == "I":  # date, float, category, str, bool
            if to_type == "date":
                unit = self.cfg.get("unit") or "D"
                if unit == "YYYYMMDD":
                    return "pd.Series({s}.astype(str).apply(pd.Timestamp), name='{name}', index={s}.index)".format(
                        s=s, name=self.name,
                    )
                return "pd.Series(pd.to_datetime({s}, unit='{unit}'), name='{name}', index={s}.index)".format(
                    s=s, name=self.name, unit=unit
                )
            return "pd.Series({s}.astype('{to_type}'), name='{name}', index={s}.index)".format(
                s=s, to_type=to_type, name=self.name
            )
        elif classifier == "F":  # str, int
            return "pd.Series(s.astype('{to_type}'), name='{name}', index={s}.index)".format(
                s=s, to_type=to_type, name=self.name
            )
        elif classifier == "D":  # str, int
            if to_type == "int":
                unit = self.cfg.get("unit") or "D"
                if unit == "YYYYMMDD":
                    return "pd.Series({s}.dt.strftime('%Y%m%d').astype(int), name='{name}', index={s}.index)".format(
                        s=s, name=self.name
                    )
                return (
                    "pd.Series(\n"
                    "\t{s}.apply(lambda x: time.mktime(x.timetuple())).astype(int), \n"
                    "name='{name}', index={s}.index\n"
                    ")"
                ).format(s=s, name=self.name)
            return "pd.Series({s}.dt.strftime('{fmt}'), name='{name}', index={s}.index)".format(
                fmt=self.cfg.get("fmt") or "%Y%m%d", s=s, name=self.name
            )
        elif classifier == "B":
            return "pd.Series(s.astype('{to_type}'), name='{name}', index={s}.index)".format(
                s=s, to_type=to_type, name=self.name
            )
        raise NotImplementedError(
            "data type conversion not supported for dtype: {}".format(from_type)
        )

    def build_code(self):
        code = self.build_inner_code()
        return "df.loc[:, '{name}'] = {code}".format(name=self.name, code=code)


class TransformColumnBuilder(object):
    def __init__(self, name, cfg):
        self.name = name
        self.cfg = cfg

    def build_column(self, data):
        group, col, agg = (self.cfg.get(p) for p in ["group", "col", "agg"])
        return pd.Series(
            data.groupby(group)[col].transform(agg), index=data.index, name=self.name
        )

    def build_code(self):
        group, col, agg = (self.cfg.get(p) for p in ["group", "col", "agg"])
        code = (
            "pd.Series(\n"
            "\tdata.groupby(['{group}'])['{col}'].transform('{agg}'), index=data.index, name='{name}'\n"
            ")"
        ).format(name=self.name, col=col, agg=agg, group="','".join(group))
        return "df.loc[:, '{name}'] = {code}".format(name=self.name, code=code)


class WinsorizeColumnBuilder(object):
    def __init__(self, name, cfg):
        self.name = name
        self.cfg = cfg

    def build_column(self, data):
        group, col, limits, inclusive = (
            self.cfg.get(p) for p in ["group", "col", "limits", "inclusive"]
        )
        kwargs = {
            k: self.cfg[k]
            for k in ["limits", "inclusive"]
            if self.cfg.get(k) is not None
        }
        if len(group or []):

            def winsorize_series(group):
                return mstats.winsorize(group, **kwargs)

            winsorized_data = data.groupby(group)[col].transform(winsorize_series)
        else:
            winsorized_data = mstats.winsorize(data[col], **kwargs)
        return pd.Series(winsorized_data, index=data.index, name=self.name)

    def build_code(self):
        group, col, limits, inclusive = (
            self.cfg.get(p) for p in ["group", "col", "limits", "inclusive"]
        )
        winsorize_params = []
        if limits is not None:
            winsorize_params.append("limits=[{}]".format(", ".join(map(str, limits))))
        if inclusive is not None:
            winsorize_params.append(
                "inclusive=[{}]".format(", ".join(map(str, inclusive)))
            )
        if len(winsorize_params):
            winsorize_params = ", {}".format(", ".join(winsorize_params))
        else:
            winsorize_params = ""
        if len(group or []):
            code = (
                "from scipy.stats import mstats\n\n"
                "def winsorize_series(group):\n"
                "\treturn mstats.winsorize(group{params})\n\n"
                "winsorized_data = data.groupby(['{group}'])['{col}'].transform(winsorize_series)\n"
                "winsorized_data = pd.Series(winsorized_data, index=data.index, name='{name}')"
            ).format(
                params=winsorize_params,
                col=col,
                group="', '".join(group),
                name=self.name,
            )
        else:
            code = (
                "from scipy.stats import mstats\n\n"
                "winsorized_data = mstats.winsorize(data['{col}']{params})\n"
                "winsorized_data = pd.Series(winsorized_data, index=data.index, name='{name}')"
            ).format(params=winsorize_params, col=col, name=self.name)
        return [code, "df.loc[:, '{name}'] = winsorized_data".format(name=self.name)]


ZERO_STD_ERROR = "Column consists of a constant value and z-score normalization will result in all nans!"


class ZScoreNormalizeColumnBuilder(object):
    def __init__(self, name, cfg):
        self.name = name
        self.cfg = cfg

    def build_column(self, data):
        col = self.cfg.get("col")
        if data[col].std() == 0:
            raise Exception(ZERO_STD_ERROR)
        return pd.Series(
            (data[col] - data[col].mean()) / data[col].std(ddof=0),
            index=data.index,
            name=self.name,
        )

    def build_code(self):
        col = self.cfg.get("col")
        return (
            "df.loc[:, '{name}'] = pd.Series(\n"
            "\t(data['{col}'] - data['{col}'].mean()) / data['{col}'].std(ddof=0), index=data.index, name='{name}'\n"
            ")"
        ).format(name=self.name, col=col)
