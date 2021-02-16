import json
import pandas as pd

import dtale.global_state as global_state


class CombineData(object):
    def __init__(self, cfg):
        action, config, datasets = (
            cfg.get(prop) for prop in ["action", "config", "datasets"]
        )
        config = json.loads(config)
        datasets = json.loads(datasets)
        self.builder = (
            MergeBuilder(config, datasets)
            if action == "merge"
            else StackBuilder(config, datasets)
        )

    def build_data(self):
        return self.builder.build_data()

    def build_code(self):
        return "\n".join(self.builder.build_code())


def build_df(dataset, is_merge=False):
    data = global_state.get_data(dataset["dataId"])
    cols = dataset.get("columns")
    cols = list(set(cols + (dataset["index"] if is_merge else []))) if cols else None
    if cols:
        data = data[cols]
    if is_merge and dataset["index"]:
        data = data.set_index(dataset["index"])
    return data


def build_code_data(datasets, is_merge=False):
    code = ["import dtale\n"]

    def build_idx(index):
        return ".setIndex(['{}'])".format("','".join(index))

    def build_cols(columns):
        return "[['{}']]".format("','".join(columns)) if columns else ""

    for idx, dataset in enumerate(datasets, 1):
        code.append(
            "df{idx} = dtale.get_instance('{id}').data{index}{cols}".format(
                idx=idx,
                id=dataset["dataId"],
                index="" if is_merge else build_idx(dataset["index"]),
                cols=build_cols(dataset.get("columns")),
            )
        )
    return code


class MergeBuilder(object):
    def __init__(self, config, datasets):
        self.config = config
        self.datasets = datasets

    def build_data(self):
        dfs = []
        for dataset in self.datasets:
            dfs.append((build_df(dataset, is_merge=True), dataset["suffix"] or None))

        how, indicator, sort = (
            self.config.get(prop) for prop in ["how", "indicator", "sort"]
        )
        left_df, left_suffix = dfs.pop(0)
        right_df, right_suffix = dfs.pop(0)
        kwargs = dict(
            how=how,
            left_index=True,
            right_index=True,
            suffixes=[left_suffix, right_suffix],
        )
        if indicator:
            kwargs["indicator"] = "merge_1"
        if sort:
            kwargs["sort"] = sort
        final_df = left_df.merge(right_df, **kwargs)
        if len(dfs):
            for idx, (df, suffix) in enumerate(dfs, 2):
                if suffix:
                    kwargs["suffixes"] = [None, suffix]
                else:
                    kwargs.pop("suffixes", None)
                if indicator:
                    kwargs["indicator"] = "merge_{}".format(idx)
                final_df = final_df.merge(df, **kwargs)
        return final_df

    def build_code(self):
        code = build_code_data(self.datasets, is_merge=True)
        how, indicator, sort = (
            self.config.get(prop) for prop in ["how", "indicator", "sort"]
        )

        def build_merge(df1, df2, left, right, ind_id=1):
            suffixes = ""
            if left.get("suffix") or right.get("suffix"):

                def suffix_str(suffix):
                    return "'{}'".format(suffix) if suffix else "None"

                suffixes = ", suffixes=[{}, {}]".format(
                    suffix_str(left.get("suffix")), suffix_str(right.get("suffix"))
                )
            sort_param = ", sort=True" if sort else ""
            indicator_param = (
                ", indicator='merge_{}".format(ind_id) if indicator else ""
            )
            return (
                "df = {df1}.merge({df2}, how='{how}', left_index=True, right_index=True"
                "{sort}{indicator}{suffixes})"
            ).format(
                df1=df1,
                df2=df2,
                how=how,
                sort=sort_param,
                indicator=indicator_param,
                suffixes=suffixes,
            )

        code.append(build_merge("df1", "df2", self.datasets[0], self.datasets[1]))
        if len(self.datasets) > 2:
            for idx, dataset in enumerate(self.datasets[2:], 3):
                code.append(build_merge("df", "df{}".format(idx), {}, dataset, idx - 1))
        return code


class StackBuilder(object):
    def __init__(self, config, datasets):
        self.config = config
        self.datasets = datasets

    def build_data(self):
        ignore_index = self.config.get("ignoreIndex")
        kwargs = {}
        if ignore_index:
            kwargs["ignore_index"] = ignore_index
        return pd.concat([build_df(dataset) for dataset in self.datasets], **kwargs)

    def build_code(self):
        code = build_code_data(self.datasets, is_merge=True)
        ignore_index = self.config.get("ignoreIndex")
        ignore_index_param = ", ignore_index=True" if ignore_index else ""
        code.append(
            "df = pd.concat([{dfs}]{ignore_index})".format(
                dfs=",".join(
                    ["df{}".format(idx) for idx, _ in enumerate(self.datasets, 1)]
                ),
                ignore_index=ignore_index_param,
            )
        )
        return code
