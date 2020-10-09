import pandas as pd

import dtale.global_state as global_state
from dtale.utils import dict_merge, grid_columns, grid_formatter, triple_quote
from dtale.charts.utils import build_group_inputs_filter


class NoDuplicatesException(ValueError):
    """Container class for any instance where a user tries to remove duplicates when they don't exist."""


class NoDuplicatesToShowException(ValueError):
    """Container class for any instance where a user tries to show duplicates that don't exist."""


class RemoveAllDataException(ValueError):
    """Container class for any instance where a user tries remove duplicates and it returns an empty dataframe."""


class DuplicateCheck(object):
    def __init__(self, data_id, check_type, cfg):
        self.data_id = data_id
        if check_type == "columns":
            self.checker = DuplicateColumns(data_id, cfg)
        elif check_type == "column_names":
            self.checker = DuplicateColumnNames(data_id, cfg)
        elif check_type == "rows":
            self.checker = RemoveDuplicateRows(data_id, cfg)
        elif check_type == "show":
            self.checker = ShowDuplicates(cfg)
        else:
            raise NotImplementedError(
                "'{}' duplicate check not implemented yet!".format(check_type)
            )

    def test(self):
        data = global_state.get_data(self.data_id)
        return self.checker.check(data)

    def execute(self):
        from dtale.views import startup

        data = global_state.get_data(self.data_id)
        try:
            df, code = self.checker.remove(data)
            instance = startup("", data=df, **self.checker.startup_kwargs)
            curr_settings = global_state.get_settings(instance._data_id)
            global_state.set_settings(
                instance._data_id,
                dict_merge(curr_settings, dict(startup_code=code)),
            )
            return instance._data_id
        except NoDuplicatesException:
            return self.data_id


def process_keep(input_list, keep):
    if keep == "first":
        return input_list[1:]
    elif keep == "last":
        return input_list[:-1]
    return input_list  # none


class DuplicateColumns(object):
    def __init__(self, data_id, cfg=None):
        self.cfg = cfg
        self.startup_kwargs = dict(ignore_duplicate=True, data_id=data_id)

    def check(self, df):
        duplicate_columns = {}
        keep = self.cfg.get("keep") or "none"
        col_indexes = list(range(df.shape[1]))
        if keep == "last":
            col_indexes = col_indexes[::-1]
        for x_idx, x in enumerate(col_indexes):
            col = df.iloc[:, x]
            col_duplicates = duplicate_columns.get(df.columns.values[x], [])
            for y in col_indexes[x_idx + 1 :]:
                other_col = df.iloc[:, y]
                if col.equals(other_col):
                    col_duplicates.append(df.columns.values[y])
            duplicate_columns[df.columns.values[x]] = col_duplicates
        return {k: v for k, v in duplicate_columns.items() if len(v) > 0}

    def remove(self, df):
        duplicate_cols = self.check(df)
        keep = self.cfg.get("keep") or "none"
        cols_to_remove = []
        for col, dupes in duplicate_cols.items():
            if keep == "none":
                cols_to_remove += [col] + dupes
            else:
                cols_to_remove += dupes
        if not cols_to_remove:
            raise NoDuplicatesException()
        if len(cols_to_remove) == len(df.columns):
            raise RemoveAllDataException("This will remove all data!")
        df = df[[c for c in df.columns if c not in cols_to_remove]]
        code = (
            "duplicate_cols_to_remove = [\n"
            "\t'{cols}'\n"
            "]\n"
            "df = df[[c for c in df.columns if c not in duplicates_cols_to_remove]]"
        ).format(cols="','".join(cols_to_remove))
        return df, code


class DuplicateColumnNames(object):
    def __init__(self, data_id, cfg=None):
        self.cfg = cfg
        self.startup_kwargs = dict(ignore_duplicate=True, data_id=data_id)

    def check(self, df):
        distinct_names = {}
        for col in df.columns:
            general_name = col.strip().lower()
            names = distinct_names.get(general_name, [])
            names.append(col)
            distinct_names[general_name] = names
        return {k: v for k, v in distinct_names.items() if len(v) > 1}

    def remove(self, df):
        duplicate_names = self.check(df)
        keep = self.cfg.get("keep") or "none"
        names_to_remove = []
        for _, v in duplicate_names.items():
            names_to_remove += process_keep(v, keep)
        if not names_to_remove:
            raise NoDuplicatesException()
        if len(names_to_remove) == len(df.columns):
            raise RemoveAllDataException("This will remove all data!")
        df = df[[c for c in df.columns if c not in names_to_remove]]
        code = (
            "duplicate_cols_to_remove = [\n"
            "\t'{cols}'\n"
            "]\n"
            "df = df[[c for c in df.columns if c not in duplicates_cols_to_remove]]"
        ).format(cols="','".join(names_to_remove))
        return df, code


class RemoveDuplicateRows(object):
    def __init__(self, data_id, cfg):
        self.cfg = cfg
        self.startup_kwargs = dict(ignore_duplicate=True, data_id=data_id)

    def check(self, df):
        subset, keep = (self.cfg.get(p) for p in ["subset", "keep"])
        dupe_args = {"keep": False if keep == "none" else keep}
        duplicates = df.duplicated(subset, **dupe_args)
        return int(duplicates.sum())

    def remove(self, df):
        subset, keep = (self.cfg.get(p) for p in ["subset", "keep"])
        dupe_args = {"keep": False if keep == "none" else keep}
        duplicates = df.duplicated(subset, **dupe_args)
        dupe_ct = int(duplicates.sum())
        if not dupe_ct:
            raise NoDuplicatesException()
        if dupe_ct == len(df):
            raise RemoveAllDataException("This will remove all data!")
        df = df[~duplicates].reset_index(drop=True)
        code = self._build_code()
        return df, code

    def _build_code(self):
        subset, keep = (self.cfg.get(p) for p in ["subset", "keep"])
        keep = "False" if keep == "none" else "'{}'".format(keep)
        return (
            "duplicates = df.duplicated(['{subset}'], keep={keep})\n"
            "df = df[~duplicates]"
        ).format(subset="','".join(subset), keep=keep)


class ShowDuplicates(object):
    def __init__(self, cfg):
        self.cfg = cfg
        self.startup_kwargs = dict(ignore_duplicate=True, data_id=None)

    def check(self, df):
        group = self.cfg.get("group")
        duplicates = df[group].reset_index().groupby(group).count()
        duplicates = duplicates.iloc[:, 0]
        duplicates = duplicates[duplicates > 1]
        duplicate_counts = duplicates.values
        duplicates = duplicates.reset_index()[group]
        duplicates = grid_formatter(
            grid_columns(duplicates), as_string=True
        ).format_lists(duplicates)
        check_data = {
            ", ".join([duplicates[col][i] for col in group]): dict(
                count=int(ct), filter=[duplicates[col][i] for col in group]
            )
            for i, ct in enumerate(duplicate_counts)
        }
        return check_data

    def remove(self, df):
        group = self.cfg.get("group")
        duplicates = [g for _, g in df.groupby(group) if len(g) > 1]
        if not duplicates:
            raise NoDuplicatesToShowException("No duplicates to show!")
        duplicates = pd.concat(duplicates)
        group_filter = None
        if self.cfg.get("filter"):
            group_filter = build_group_inputs_filter(
                df, [{col: val for col, val in zip(group, self.cfg["filter"])}]
            )
            duplicates = duplicates.query(group_filter)
        code = self._build_code(group_filter)
        self.startup_kwargs["name"] = "{group}_duplicates".format(group="_".join(group))
        return duplicates, code

    def _build_code(self, group_filter=None):
        group = self.cfg.get("group")
        group_filter_str = ""
        if group_filter:
            group_filter_str = "\ndf = df.query({filter})".format(
                filter=triple_quote(group_filter_str)
            )
        return (
            "df = pd.concat(g for _, g in df.groupby(['{group}']) if len(g) > 1)"
            "{filter}"
        ).format(group="','".join(group), filter=group_filter_str)
