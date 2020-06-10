import re

import numpy as np
import pandas as pd
from six import string_types

import dtale.global_state as global_state
from dtale.utils import classify_type, find_dtype


class ColumnReplacement(object):
    def __init__(self, data_id, col, replacement_type, cfg, name=None):
        self.data_id = data_id
        if replacement_type == "spaces":
            self.builder = SpaceReplacement(col, cfg, name)
        elif replacement_type == "strings":
            self.builder = StringReplacement(col, cfg, name)
        elif replacement_type == "value":
            self.builder = ValueReplacement(col, cfg, name)
        elif replacement_type == "imputer":  # iterative, knn, simple
            self.builder = ImputerReplacement(col, cfg, name)
        else:
            raise NotImplementedError(
                "'{}' replacement not implemented yet!".format(replacement_type)
            )

    def build_replacements(self):
        return self.builder.build_column(global_state.get_data(self.data_id))

    def build_code(self):
        return self.builder.build_code(global_state.get_data(self.data_id))


def get_inner_replacement_value(val):
    return np.nan if isinstance(val, string_types) and val.lower() == "nan" else val


def get_replacement_value(cfg, prop):
    value = (cfg or {}).get(prop) or "nan"
    return get_inner_replacement_value(value)


def get_inner_replacement_value_as_str(val, series):
    if isinstance(val, string_types) and val.lower() == "nan":
        return "np.nan"
    if classify_type(find_dtype(series)) == "S":
        return "'{value}'".format(value=val)
    return val


def get_replacement_value_as_str(cfg, prop, series):
    value = (cfg or {}).get(prop) or "nan"
    return get_inner_replacement_value_as_str(value, series)


class SpaceReplacement(object):
    def __init__(self, col, cfg, name):
        self.col = col
        self.cfg = cfg
        self.name = name

    def build_column(self, data):
        value = get_replacement_value(self.cfg, "value")
        return data[self.col].replace(r"^\s+$", value, regex=True)

    def build_code(self, data):
        value = get_replacement_value_as_str(self.cfg, "value", data[self.col])
        return "df.loc[:, '{name}'] = df['{col}'].replace(r'^\\s+$', {value}, regex=True)".format(
            name=self.name or self.col, col=self.col, value=value
        )


class StringReplacement(object):
    def __init__(self, col, cfg, name):
        self.col = col
        self.cfg = cfg
        self.name = name

    def parse_cfg(self):
        return (self.cfg[p] for p in ["value", "ignoreCase", "isChar"])

    def build_column(self, data):
        value, ignore_case, is_char = self.parse_cfg()
        flags = re.UNICODE
        if ignore_case:
            flags |= re.IGNORECASE
        value = re.escape(value)
        if is_char:
            value = "[{value}]+".format(value=value)
        regex_pat = re.compile(r"^ *{value} *$".format(value=value), flags=flags)
        replace_with = get_replacement_value(self.cfg, "replace")
        return data[self.col].replace(regex_pat, replace_with, regex=True)

    def build_code(self, data):
        value, ignore_case, is_char = self.parse_cfg()
        flags = re.UNICODE
        if ignore_case:
            flags |= re.IGNORECASE

        regex_exp = "r'^ *{value} *$'.format(value=re.escape({value}))"
        if is_char:
            regex_exp = "r'^ *[{value}]+ *$'.format(value=re.escape({value}))"
        regex_exp = regex_exp.format(value=value)

        replace_with = get_replacement_value_as_str(self.cfg, "replace", data[self.col])

        return (
            "import re\n\n"
            "regex_pat = re.compile({regex_exp}, flags={flags})\n"
            "df.loc[:, '{name}'] = df['{col}'].replace(regex_pat, {replace}, regex=True)"
        ).format(
            name=self.name or self.col,
            col=self.col,
            regex_exp=regex_exp,
            flags=flags,
            replace=replace_with,
        )


class ValueReplacement(object):
    def __init__(self, col, cfg, name):
        self.col = col
        self.cfg = cfg
        self.name = name

    def build_column(self, data):
        s = data[self.col]
        replacements = {}
        col_replacements = []
        for replacement in self.cfg.get("value", []):
            value = get_replacement_value(replacement, "value")
            replacement_type = replacement.get("type")
            if replacement_type == "agg":
                replace = getattr(s, replacement["replace"])()  # min, max, mean, median
                if pd.isnull(replace):
                    raise Exception(
                        "Running the aggregation, {agg}, on {col} resulted in nan, this would result in a no-op."
                    )
            elif replacement_type == "col":
                col_replacements.append(
                    lambda s2: np.where(s2 == value, data[replacement["replace"]], s2)
                )
            else:
                replace = get_replacement_value(replacement, "replace")
            replacements[value] = replace
        final_s = s
        if len(replacements):
            final_s = final_s.replace(replacements)
        for col_r in col_replacements:
            final_s = col_r(final_s)
        return final_s

    def build_code(self, data):
        replacements = []
        series = data[self.col]
        col_replacements = []
        for replacement in self.cfg.get("value", []):
            value = get_replacement_value_as_str(replacement, "value", series)
            replacement_type = self.cfg.get("type")
            if replacement_type == "agg":
                replace = "getattr(df['{col}'], '{agg}')()".format(
                    agg=replacement["value"], col=self.col
                )
            elif replacement_type == "col":
                col_replacements.append(
                    "s = np.where(s == {value}, data['{col2}'], s)".format(
                        col2=replacement["replace"], value=value
                    )
                )
            else:
                replace = get_replacement_value_as_str(replacement, "replace", series)
            replacements.append(
                "\t{value}: {replace}".format(value=value, replace=replace)
            )

        code = ["s = df['{col}']".format(col=self.col)]
        if len(replacements):
            replacements = ",\n".join(replacements)
            replacements = "{\n" + replacements + "}"
            code.append(
                "s = s.replace({replacements})".format(replacements=replacements)
            )
        code += col_replacements
        code.append("df.loc[:, '{name}'] = s".format(name=self.name or self.col))
        return "\n".join(code)


class ImputerReplacement(object):
    def __init__(self, col, cfg, name):
        self.col = col
        self.cfg = cfg
        self.name = name

    def build_column(self, data):
        imputer_type = self.cfg["type"]
        if imputer_type == "iterative":
            try:
                from sklearn.experimental import enable_iterative_imputer  # noqa
                from sklearn.impute import IterativeImputer
            except ImportError:
                raise Exception(
                    "You must have at least scikit-learn 0.21.0 installed in order to use the Iterative Imputer!"
                )
            imputer = IterativeImputer()
        elif imputer_type == "knn":
            try:
                from sklearn.impute import KNNImputer
            except ImportError:
                raise Exception(
                    "You must have at least scikit-learn 0.22.0 installed in order to use the Iterative Imputer!"
                )
            n_neighbors = self.cfg.get("n_neighbors") or 2
            imputer = KNNImputer(n_neighbors=n_neighbors)
        elif imputer_type == "simple":
            try:
                from sklearn.impute import SimpleImputer
            except ImportError:
                raise Exception(
                    "You must have at least scikit-learn 0.20.0 installed in order to use the Iterative Imputer!"
                )
            imputer = SimpleImputer()
        else:
            raise NotImplementedError(
                "'{}' sklearn imputer not implemented yet!".format(imputer_type)
            )
        output = imputer.fit_transform(data[[self.col]])
        return pd.DataFrame(output, columns=[self.col], index=data.index)[self.col]

    def build_code(self, _data):
        imputer_type = self.cfg["type"]
        code = []
        if imputer_type == "iterative":
            code.append(
                (
                    "from sklearn.experimental import enable_iterative_imputer\n"
                    "from sklearn.impute import IterativeImputer\n\n"
                    "output = IterativeImputer().fit_transform(df[['{col}']])"
                ).format(col=self.col)
            )
        elif imputer_type == "knn":
            n_neighbors = self.cfg.get("n_neighbors") or 2
            code.append(
                (
                    "from sklearn.impute import KNNImputer\n\n"
                    "output = KNNImputer(n_neighbors={n_neighbors}).fit_transform(df[['{col}']])"
                ).format(col=self.col, n_neighbors=n_neighbors)
            )
        elif imputer_type == "simple":
            code.append(
                (
                    "from sklearn.impute import SimpleImputer\n\n"
                    "output = SimpleImputer().fit_transform(df[['{col}']])"
                ).format(col=self.col)
            )
        code.append(
            "df.loc[:, '{name}'] = pd.DataFrame(output, columns=['{col}'], index=df.index)['{col}']".format(
                name=self.name or self.col, col=self.col
            )
        )
        return "\n".join(code)
