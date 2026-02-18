import json
import re

import numpy as np
import pandas as pd
from six import string_types

import dtale.global_state as global_state
from dtale.utils import classify_type, find_dtype, format_data, make_list
from dtale.query import build_col_key

# Patterns that could enable code execution via pandas.DataFrame.query()
_DANGEROUS_PATTERNS = re.compile(
    r"(__\w+__"  # dunder attributes (__import__, __class__, etc.)
    r"|(?<!\w)import\s*\("  # import() calls
    r"|(?<!\w)exec\s*\("  # exec() calls
    r"|(?<!\w)eval\s*\("  # eval() calls
    r"|(?<!\w)compile\s*\("  # compile() calls
    r"|(?<!\w)open\s*\("  # open() calls
    r"|(?<!\w)getattr\s*\("  # getattr() calls
    r"|(?<!\w)setattr\s*\("  # setattr() calls
    r"|(?<!\w)delattr\s*\("  # delattr() calls
    r"|(?<!\w)globals\s*\("  # globals() calls
    r"|(?<!\w)locals\s*\("  # locals() calls
    r"|(?<!\w)vars\s*\("  # vars() calls
    r"|(?<!\w)dir\s*\("  # dir() calls
    r"|(?<!\w)type\s*\("  # type() calls
    r"|(?<!\w)os\."  # os module access
    r"|(?<!\w)sys\."  # sys module access
    r"|(?<!\w)subprocess"  # subprocess module access
    r"|(?<!\w)shutil\."  # shutil module access
    r"|@\w+"  # @ references to local variables in query scope
    r")",
    re.IGNORECASE,
)


class ColumnFilterSecurity(object):
    """Validation helpers to guard against code injection via DataFrame.query()."""

    @staticmethod
    def validate_string_value(val):
        """Validate a string value used in filter queries."""
        if not isinstance(val, string_types):
            val = str(val)
        if _DANGEROUS_PATTERNS.search(val):
            raise ValueError(
                "Filter value contains potentially unsafe content: {}".format(repr(val))
            )
        return val

    @staticmethod
    def validate_numeric_value(val):
        """Validate that a value is actually numeric. Returns the original value if valid."""
        if val is None:
            return val
        if isinstance(val, (int, float, np.integer, np.floating)):
            return val
        # Try to parse string as a number (validation only, return original value)
        try:
            if isinstance(val, string_types):
                stripped = val.strip()
                if _DANGEROUS_PATTERNS.search(stripped):
                    raise ValueError(
                        "Numeric filter value contains potentially unsafe content: {}".format(
                            repr(val)
                        )
                    )
                float(stripped)  # validate it parses as a number
                return val  # return original to preserve existing query format
        except (ValueError, TypeError):
            pass
        raise ValueError("Expected numeric value, got: {}".format(repr(val)))

    @staticmethod
    def validate_date_value(val):
        """Validate that a value is a safe date string."""
        if val is None:
            return val
        if not isinstance(val, string_types):
            val = str(val)
        # Date values should only contain digits, dashes, colons, T, Z, dots, spaces, +
        if not re.match(r"^[\d\-/:T Z.+]+$", val):
            raise ValueError(
                "Date filter value contains invalid characters: {}".format(repr(val))
            )
        if _DANGEROUS_PATTERNS.search(val):
            raise ValueError(
                "Date filter value contains potentially unsafe content: {}".format(
                    repr(val)
                )
            )
        return val

    @staticmethod
    def validate_operand(operand, allowed):
        """Validate that the operand is in the allowed set."""
        if operand not in allowed:
            raise ValueError(
                "Invalid operand: {}. Allowed: {}".format(repr(operand), allowed)
            )
        return operand

    @staticmethod
    def validate_outlier_query(query):
        """Validate an outlier filter query string."""
        if query is None:
            return query
        if not isinstance(query, string_types):
            raise ValueError("Outlier query must be a string")
        if _DANGEROUS_PATTERNS.search(query):
            raise ValueError(
                "Outlier filter query contains potentially unsafe content: {}".format(
                    repr(query)
                )
            )
        return query


class ArcticDBColumnFilter(object):
    def __init__(self, saved_filter):
        self.cfg = saved_filter
        column, classification, filter_type = (
            self.cfg["meta"].get(p) for p in ["column", "classification", "type"]
        )
        self.column = column
        self.classification = classification
        if filter_type == "string":
            self.builder = StringFilter(column, self.classification, self.cfg)
        if filter_type in ["int", "float"]:
            self.builder = NumericFilter(column, self.classification, self.cfg)
        if filter_type == "date":
            self.builder = DateFilter(column, self.classification, self.cfg)
        if filter_type == "outliers":
            self.builder = OutlierFilter(column, self.classification, self.cfg)


class ColumnFilter(object):
    def __init__(self, data_id, column, cfg):
        self.data_id = data_id
        self.column = column
        dtype = (global_state.get_dtype_info(data_id, column) or {}).get("dtype")
        if not dtype:
            if global_state.is_arcticdb:
                instance = global_state.store.get(data_id)
                data, _ = format_data(instance.base_df)
                s = data[column]
            else:
                s = global_state.get_data(data_id, columns=[column])[column]
            dtype = find_dtype(s)
        self.classification = classify_type(dtype)
        self.cfg = cfg
        if self.cfg is not None:
            self.cfg = json.loads(self.cfg)
        if self.cfg["type"] == "string":
            self.builder = StringFilter(column, self.classification, self.cfg)
        if self.cfg["type"] in ["int", "float"]:
            self.builder = NumericFilter(column, self.classification, self.cfg)
        if self.cfg["type"] == "date":
            self.builder = DateFilter(column, self.classification, self.cfg)
        if self.cfg["type"] == "outliers":
            self.builder = OutlierFilter(column, self.classification, self.cfg)

    def save_filter(self):
        curr_settings = global_state.get_settings(self.data_id)
        filters_key = "{}Filters".format(
            "outlier" if self.cfg["type"] == "outliers" else "column"
        )
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
        ColumnFilterSecurity.validate_outlier_query(self.cfg.get("query"))
        return self.cfg


class MissingOrPopulatedFilter(object):
    def __init__(self, column, classification, cfg):
        self.column = column
        self.classification = classification
        self.cfg = cfg

    def handle_missing_or_populated(self, fltr):
        if self.cfg is None or (
            not self.cfg.get("missing", False) and not self.cfg.get("populated", False)
        ):
            return fltr
        if self.cfg.get("missing", False):
            return {
                "missing": True,
                "meta": {
                    "column": self.column,
                    "classification": self.classification,
                    "type": self.cfg["type"],
                },
                "query": "{col}.isnull()".format(col=build_col_key(self.column)),
            }
        if self.cfg.get("populated", False):
            return {
                "populated": True,
                "meta": {
                    "column": self.column,
                    "classification": self.classification,
                    "type": self.cfg["type"],
                },
                "query": "~{col}.isnull()".format(col=build_col_key(self.column)),
            }

    def update_missing_or_populated_query_builder(self, query_builder, fltr=None):
        if self.cfg is None or (
            not self.cfg.get("missing", False) and not self.cfg.get("populated", False)
        ):
            return fltr
        # TODO: how to handle scenarios where QueryBuilder doesn't support functionality so do it manually
        if self.cfg.get("missing", False):
            return query_builder[self.column] != query_builder[self.column]
        if self.cfg.get("populated", False):
            return query_builder[self.column] == query_builder[self.column]


def handle_ne(query, operand):
    if operand != "=":
        return "~({})".format(query)
    return query


def handle_query_builder_ne(query, operand):
    if operand != "=":
        return ~query
    return query


class StringFilter(MissingOrPopulatedFilter):
    def __init__(self, column, classification, cfg):
        super(StringFilter, self).__init__(column, classification, cfg)

    def build_filter(self):
        if self.cfg is None:
            return super(StringFilter, self).handle_missing_or_populated(None)

        action = self.cfg.get("action", "equals")
        # Validate action
        if action not in (
            "equals",
            "startswith",
            "endswith",
            "contains",
            "regex",
            "length",
        ):
            raise ValueError("Invalid string filter action: {}".format(repr(action)))
        if action == "equals" and not len(self.cfg.get("value", [])):
            return super(StringFilter, self).handle_missing_or_populated(None)
        elif action != "equals" and not self.cfg.get("raw"):
            return super(StringFilter, self).handle_missing_or_populated(None)

        state = self.cfg.get("value", [])
        case_sensitive = self.cfg.get("caseSensitive", False)
        operand = self.cfg.get("operand", "=")
        raw = self.cfg.get("raw")

        # Validate inputs
        ColumnFilterSecurity.validate_operand(operand, {"=", "ne"})
        if raw is not None:
            ColumnFilterSecurity.validate_string_value(raw)
        for v in state:
            ColumnFilterSecurity.validate_string_value(v)

        fltr = dict(
            value=state,
            operand=operand,
            caseSensitive=case_sensitive,
            action=action,
            raw=raw,
            meta={
                "column": self.column,
                "classification": self.classification,
                "type": self.cfg["type"],
            },
        )
        fmt_string = "{!r}" if self.classification == "S" else "{}"
        if action == "equals":
            if len(state) == 1:
                val_str = fmt_string.format(state[0])
                fltr["query"] = "{} {} {}".format(
                    build_col_key(self.column),
                    "==" if operand == "=" else "!=",
                    val_str,
                )
            else:
                val_str = ", ".join(map(fmt_string.format, state))
                fltr["query"] = "{} {} ({})".format(
                    build_col_key(self.column),
                    "in" if operand == "=" else "not in",
                    val_str,
                )
        elif action in ["startswith", "endswith"]:
            case_insensitive_conversion = "" if case_sensitive else ".str.lower()"
            fltr["query"] = "{}{}.str.{}({!r}, na=False)".format(
                build_col_key(self.column),
                case_insensitive_conversion,
                action,
                raw if case_sensitive else raw.lower(),
            )
            fltr["query"] = handle_ne(fltr["query"], operand)
        elif action in ["contains", "regex"]:
            fltr["query"] = "{}.str.contains({!r}, na=False, case={}, regex={})".format(
                build_col_key(self.column),
                raw,
                "True" if case_sensitive else "False",
                "True" if action == "regex" else "False",
            )
            fltr["query"] = handle_ne(fltr["query"], operand)
        elif action == "length":
            # Validate length values are numeric
            if "," in raw:
                start, end = raw.split(",")
                ColumnFilterSecurity.validate_numeric_value(start.strip())
                ColumnFilterSecurity.validate_numeric_value(end.strip())
                fltr["query"] = "{start} <= {col}.str.len() <= {end}".format(
                    col=build_col_key(self.column), start=start, end=end
                )
            else:
                ColumnFilterSecurity.validate_numeric_value(raw.strip())
                fltr["query"] = "{}.str.len() == {}".format(
                    build_col_key(self.column), raw
                )
            fltr["query"] = handle_ne(fltr["query"], operand)
        return super(StringFilter, self).handle_missing_or_populated(fltr)

    def update_query_builder(self, query_builder):
        if self.cfg is None:
            return super(StringFilter, self).update_missing_or_populated_query_builder(
                query_builder
            )

        action = self.cfg.get("action", "equals")
        if action == "equals" and not len(self.cfg.get("value", [])):
            return super(StringFilter, self).update_missing_or_populated_query_builder(
                query_builder
            )
        elif action != "equals" and not self.cfg.get("raw"):
            return super(StringFilter, self).update_missing_or_populated_query_builder(
                query_builder
            )

        state = self.cfg.get("value", [])
        case_sensitive = self.cfg.get("caseSensitive", False)
        operand = self.cfg.get("operand", "=")
        raw = self.cfg.get("raw")
        fltr = dict(
            value=state,
            operand=operand,
            caseSensitive=case_sensitive,
            action=action,
            raw=raw,
        )
        if action == "equals":
            if len(state) == 1:
                fltr["query"] = handle_query_builder_ne(
                    query_builder[self.column] == state[0], operand
                )
            else:
                fltr["query"] = handle_query_builder_ne(
                    query_builder[self.column].isin(state), operand
                )
        elif action in ["startswith", "endswith"]:
            # Not supported by QueryBuilder
            pass
        elif action in ["contains", "regex"]:
            # Not supported by QueryBuilder
            pass
        elif action == "length":
            # Not supported by QueryBuilder
            pass
        return super(StringFilter, self).update_missing_or_populated_query_builder(
            query_builder, fltr.get("query")
        )


class NumericFilter(MissingOrPopulatedFilter):
    def __init__(self, column, classification, cfg):
        super(NumericFilter, self).__init__(column, classification, cfg)

    def build_filter(self):
        if self.cfg is None:
            return super(NumericFilter, self).handle_missing_or_populated(None)
        cfg_val, cfg_operand, cfg_min, cfg_max = (
            self.cfg.get(p) for p in ["value", "operand", "min", "max"]
        )

        # Validate operand (allow None for missing/populated-only filters)
        if cfg_operand is not None:
            ColumnFilterSecurity.validate_operand(
                cfg_operand, {"=", "ne", "<", ">", "<=", ">=", "[]", "()"}
            )

        base_fltr = dict(
            operand=cfg_operand,
            meta={
                "column": self.column,
                "classification": self.classification,
                "type": self.cfg["type"],
            },
        )
        if cfg_operand in ["=", "ne"]:
            state = make_list(cfg_val or [])
            if not len(state):
                return super(NumericFilter, self).handle_missing_or_populated(None)
            # Validate all values are numeric
            state = [ColumnFilterSecurity.validate_numeric_value(v) for v in state]
            fltr = dict(value=cfg_val, **base_fltr)
            if len(state) == 1:
                fltr["query"] = "{} {} {}".format(
                    build_col_key(self.column),
                    "==" if cfg_operand == "=" else "!=",
                    state[0],
                )
            else:
                fltr["query"] = "{} {} ({})".format(
                    build_col_key(self.column),
                    "in" if cfg_operand == "=" else "not in",
                    ", ".join(map(str, state)),
                )
            return super(NumericFilter, self).handle_missing_or_populated(fltr)
        if cfg_operand in ["<", ">", "<=", ">="]:
            if cfg_val is None:
                return super(NumericFilter, self).handle_missing_or_populated(None)
            cfg_val = ColumnFilterSecurity.validate_numeric_value(cfg_val)
            fltr = dict(
                value=cfg_val,
                query="{} {} {}".format(
                    build_col_key(self.column), cfg_operand, cfg_val
                ),
                **base_fltr
            )
            return super(NumericFilter, self).handle_missing_or_populated(fltr)
        if cfg_operand in ["[]", "()"]:
            fltr = dict(**base_fltr)
            queries = []
            if cfg_min is not None:
                cfg_min = ColumnFilterSecurity.validate_numeric_value(cfg_min)
                fltr["min"] = cfg_min
                queries.append(
                    "{} >{} {}".format(
                        build_col_key(self.column),
                        "=" if cfg_operand == "[]" else "",
                        cfg_min,
                    )
                )
            if cfg_max is not None:
                cfg_max = ColumnFilterSecurity.validate_numeric_value(cfg_max)
                fltr["max"] = cfg_max
                queries.append(
                    "{} <{} {}".format(
                        build_col_key(self.column),
                        "=" if cfg_operand == "[]" else "",
                        cfg_max,
                    )
                )
            if len(queries) == 2 and cfg_max == cfg_min:
                queries = ["{} == {}".format(build_col_key(self.column), cfg_max)]
            if not len(queries):
                return super(NumericFilter, self).handle_missing_or_populated(None)
            fltr["query"] = " and ".join(queries)
            return super(NumericFilter, self).handle_missing_or_populated(fltr)
        return super(NumericFilter, self).handle_missing_or_populated(None)

    def update_query_builder(self, query_builder):
        if self.cfg is None:
            return super(NumericFilter, self).update_missing_or_populated_query_builder(
                query_builder
            )
        cfg_val, cfg_operand, cfg_min, cfg_max = (
            self.cfg.get(p) for p in ["value", "operand", "min", "max"]
        )

        if cfg_operand in ["=", "ne"]:
            state = make_list(cfg_val or [])
            if self.cfg.get("meta", {}).get("type") == "float":
                state = [np.float64(val) for val in state]
            if not len(state):
                return super(
                    NumericFilter, self
                ).update_missing_or_populated_query_builder(query_builder)
            fltr = dict(value=cfg_val, operand=cfg_operand)
            if len(state) == 1:
                fltr["query"] = handle_query_builder_ne(
                    query_builder[self.column] == state[0], cfg_operand
                )
            else:
                fltr["query"] = handle_query_builder_ne(
                    query_builder[self.column].isin(state), cfg_operand
                )
            return super(NumericFilter, self).update_missing_or_populated_query_builder(
                query_builder, fltr.get("query")
            )
        if cfg_operand in ["<", ">", "<=", ">="]:
            if cfg_val is None:
                return super(
                    NumericFilter, self
                ).update_missing_or_populated_query_builder(query_builder)
            fltr = dict(value=cfg_val, operand=cfg_operand)
            if cfg_operand == "<":
                fltr["query"] = query_builder[self.column] < cfg_val
            elif cfg_operand == ">":
                fltr["query"] = query_builder[self.column] > cfg_val
            elif cfg_operand == "<=":
                fltr["query"] = query_builder[self.column] <= cfg_val
            elif cfg_operand == ">=":
                fltr["query"] = query_builder[self.column] >= cfg_val
            return super(NumericFilter, self).update_missing_or_populated_query_builder(
                query_builder, fltr.get("query")
            )
        if cfg_operand in ["[]", "()"]:
            # Not supported by QueryBuilder
            return super(NumericFilter, self).update_missing_or_populated_query_builder(
                query_builder
            )
        return super(NumericFilter, self).update_missing_or_populated_query_builder(
            query_builder
        )


class DateFilter(MissingOrPopulatedFilter):
    def __init__(self, column, classification, cfg):
        super(DateFilter, self).__init__(column, classification, cfg)

    def build_filter(self):
        if self.cfg is None:
            return super(DateFilter, self).handle_missing_or_populated(None)

        start, end = (self.cfg.get(p) for p in ["start", "end"])
        # Validate date values
        if start:
            ColumnFilterSecurity.validate_date_value(start)
        if end:
            ColumnFilterSecurity.validate_date_value(end)
        fltr = dict(
            start=start,
            end=end,
            meta={
                "column": self.column,
                "classification": self.classification,
                "type": self.cfg["type"],
            },
        )
        queries = []
        if start:
            queries.append("{} >= '{}'".format(build_col_key(self.column), start))
        if end:
            queries.append("{} <= '{}'".format(build_col_key(self.column), end))
        if len(queries) == 2 and start == end:
            queries = ["{} == '{}'".format(build_col_key(self.column), start)]
        if not len(queries):
            return super(DateFilter, self).handle_missing_or_populated(None)
        fltr["query"] = " and ".join(queries)
        return super(DateFilter, self).handle_missing_or_populated(fltr)

    def update_query_builder(self, query_builder):
        # TODO: need to use datetime.datetime and then for equivalence you need to do (col > input - 1) & (col <= input)
        # pd.Timestamp('2023-01-04').to_pydatetime() -> to get datetime.datetime
        if self.cfg is None:
            return super(DateFilter, self).update_missing_or_populated_query_builder(
                query_builder
            )

        start, end = (self.cfg.get(p) for p in ["start", "end"])
        fltr = dict(start=start, end=end)
        queries = []
        if start:
            start = (
                pd.Timestamp(start) - pd.tseries.frequencies.to_offset("1D")
            ).to_pydatetime()
            queries.append(query_builder[self.column] > start)
        if end:
            queries.append(
                query_builder[self.column] <= pd.Timestamp(end).to_pydatetime()
            )
        if len(queries) == 2 and start == end:
            start_start = (
                pd.Timestamp(start) - pd.tseries.frequencies.to_offset("1D")
            ).to_pydatetime()
            start_end = pd.Timestamp(start).to_pydatetime()
            queries = [
                (query_builder[self.column] > start_start)
                & (query_builder[self.column] <= start_end)
            ]
        if not len(queries):
            return super(DateFilter, self).handle_missing_or_populated(None)
        if len(queries) == 2:
            fltr["query"] = queries[0] & queries[1]
        else:
            fltr["query"] = queries[0]
        return super(DateFilter, self).update_missing_or_populated_query_builder(
            query_builder, fltr.get("query")
        )
