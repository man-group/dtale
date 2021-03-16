import numpy as np

from dtale.utils import grid_columns, grid_formatter, json_int, json_float


def load_describe(column_series, additional_aggs=None):
    """
    Helper function for grabbing the output from :meth:`pandas:pandas.Series.describe` in a JSON serializable format

    :param column_series: data to describe
    :type column_series: :class:`pandas:pandas.Series`
    :return: JSON serializable dictionary of the output from calling :meth:`pandas:pandas.Series.describe`
    """
    desc = column_series.describe().to_frame().T
    code = [
        "# main statistics",
        "stats = df['{col}'].describe().to_frame().T".format(col=column_series.name),
    ]
    if additional_aggs:
        for agg in additional_aggs:
            if agg == "mode":
                mode = column_series.mode().values
                desc["mode"] = np.nan if len(mode) > 1 else mode[0]
                code.append(
                    (
                        "# mode\n"
                        "mode = df['{col}'].mode().values\n"
                        "stats['mode'] = np.nan if len(mode) > 1 else mode[0]"
                    ).format(col=column_series.name)
                )
                continue
            desc[agg] = getattr(column_series, agg)()
            code.append(
                "# {agg}\nstats['{agg}'] = df['{col}'].{agg}()".format(
                    col=column_series.name, agg=agg
                )
            )
    desc_f_overrides = {
        "I": lambda f, i, c: f.add_int(i, c, as_string=True),
        "F": lambda f, i, c: f.add_float(i, c, precision=4, as_string=True),
    }
    desc_f = grid_formatter(
        grid_columns(desc), nan_display="nan", overrides=desc_f_overrides
    )
    desc = desc_f.format_dict(next(desc.itertuples(), None))
    if "count" in desc:
        # pandas always returns 'count' as a float and it adds useless decimal points
        desc["count"] = desc["count"].split(".")[0]
    desc["total_count"] = json_int(len(column_series), as_string=True)
    missing_ct = column_series.isnull().sum()
    desc["missing_pct"] = json_float((missing_ct / len(column_series) * 100).round(2))
    desc["missing_ct"] = json_int(missing_ct, as_string=True)
    return desc, code
