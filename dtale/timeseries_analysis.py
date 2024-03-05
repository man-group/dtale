import pandas as pd
from six import PY3
from statsmodels.tsa.filters.bk_filter import bkfilter
from statsmodels.tsa.filters.cf_filter import cffilter
from statsmodels.tsa.filters.hp_filter import hpfilter
from statsmodels.tsa.seasonal import seasonal_decompose

import dtale.global_state as global_state
from dtale.query import run_query
from dtale.charts.utils import build_base_chart


def build_data(data, cfg):
    index, col, agg = (cfg.get(p) for p in ["index", "col", "agg"])
    if agg:
        return getattr(data.groupby(index)[col], agg)()
    if data[index].duplicated().any():
        raise ValueError(
            "It appears there is duplicates in your index, please specify an aggregation!"
        )
    return data.set_index(index)[col]


class TimeseriesAnalysis(object):
    def __init__(self, data_id, report_type, cfg):
        self.data_id = data_id
        if report_type == "hpfilter":
            self.report = HPFilter(cfg)
        elif report_type == "bkfilter":
            self.report = BKFilter(cfg)
        elif report_type == "cffilter":
            self.report = CFFilter(cfg)
        elif report_type == "seasonal_decompose":
            self.report = SeasonalDecompose(cfg)
        elif PY3 and report_type == "stl":
            self.report = STLReport(cfg)
        else:
            raise NotImplementedError(
                "{} timeseries analysis not implemented yet!".format(report_type)
            )

    def run(self):
        data = run_query(
            global_state.get_data(self.data_id),
            global_state.get_query(self.data_id),
            global_state.get_context_variables(self.data_id),
        )
        return self.report.run(data)


class BKFilter(object):
    def __init__(self, cfg):
        self.cfg = cfg

    def run(self, data):
        index, col, low, high, K = (
            self.cfg.get(p) for p in ["index", "col", "low", "high", "K"]
        )
        df = build_data(data, self.cfg)
        cycle = bkfilter(df, low, high, K)
        df = pd.concat([df, cycle], axis=1, keys=[col, "cycle"])
        df = df.reset_index()
        return_data, _code = build_base_chart(
            df.fillna(0), index, [col, "cycle"], agg="raw"
        )
        return return_data


class CFFilter(object):
    def __init__(self, cfg):
        self.cfg = cfg

    def run(self, data):
        index, col, low, high, drift = (
            self.cfg.get(p) for p in ["index", "col", "low", "high", "drift"]
        )
        df = build_data(data, self.cfg)
        cycle, trend = cffilter(df, low, high, drift)
        df = pd.concat([df, cycle, trend], axis=1, keys=[col, "cycle", "trend"])
        df = df.reset_index()
        return_data, _code = build_base_chart(
            df.fillna(0), index, [col, "cycle", "trend"], agg="raw"
        )
        return return_data


class HPFilter(object):
    def __init__(self, cfg):
        self.cfg = cfg

    def run(self, data):
        index, col, lamb = (self.cfg.get(p) for p in ["index", "col", "lamb"])
        df = build_data(data, self.cfg)
        cycle, trend = hpfilter(df, lamb=1600)
        df = pd.concat([df, cycle, trend], axis=1, keys=[col, "cycle", "trend"])
        df = df.reset_index()
        return_data, _code = build_base_chart(
            df.fillna(0), index, [col, "cycle", "trend"], agg="raw"
        )
        return return_data


class SeasonalDecompose(object):
    def __init__(self, cfg):
        self.cfg = cfg

    def run(self, data):
        index, col, model = (self.cfg.get(p) for p in ["index", "col", "model"])
        df = build_data(data, self.cfg)
        sd_df = seasonal_decompose(df, model=model)

        df = pd.concat(
            [df, sd_df.seasonal, sd_df.trend, sd_df.resid],
            axis=1,
            keys=[col, "seasonal", "trend", "resid"],
        )
        df = df.reset_index()
        return_data, _code = build_base_chart(
            df.fillna(0), index, [col, "seasonal", "trend", "resid"], agg="raw"
        )
        return return_data


class STLReport(object):
    def __init__(self, cfg):
        self.cfg = cfg

    def run(self, data):
        from statsmodels.tsa.seasonal import STL

        index, col = (self.cfg.get(p) for p in ["index", "col"])
        df = build_data(data, self.cfg)
        sd_df = STL(df).fit()

        df = pd.concat(
            [df, sd_df.seasonal, sd_df.trend, sd_df.resid],
            axis=1,
            keys=[col, "seasonal", "trend", "resid"],
        )
        df = df.reset_index()
        return_data, _code = build_base_chart(
            df.fillna(0), index, [col, "seasonal", "trend", "resid"], agg="raw"
        )
        return return_data
