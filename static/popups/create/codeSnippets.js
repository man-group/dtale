import _ from "lodash";

function buildRandomCode(cfg) {
  if (cfg.type === "string") {
    return [
      "pd.Series(",
      "\t[''.join(random.choice(chars) for _ in range(length)) for _ in range(len(df)]),",
      "\tindex=df.index",
      ")",
    ];
  } else if (cfg.type === "choice") {
    let choices = cfg.choices || "a,b,c,d,e,f";
    choices = _.join(_.split(choices, ","), "','");
    return `pd.Series(np.random.choice(['${choices}'], len(df)), index=df.index)`;
  } else if (cfg.type === "bool") {
    return "pd.Series(np.random.choice([True, False], len(data)), index=df.index)";
  } else if (cfg.type === "date") {
    const start = cfg.start || "19000101";
    const end = cfg.end || "21991231";
    if (cfg.timestamps) {
      return [
        "def pp(start, end, n):",
        "\tstart_u = start.value // 10 ** 9",
        "\tend_u = end.value // 10 ** 9",
        "\treturn pd.DatetimeIndex(",
        "\t\t10 ** 9 * np.random.randint(start_u, end_u, n)).view('M8[ns]')",
        "\t)",
        "",
        `pp(pd.Timestamp('${start}'), pd.Timestamp('${end}'), len(df))`,
      ];
    } else {
      const freq = cfg.businessDay ? ", freq='B'" : "";
      return [
        `dates = pd.date_range('${start}', '${end}'${freq}).to_list()`,
        "pd.Series(",
        "\t[dates[i] for i in np.random.randint(0, len(dates) - 1, size=len(df))],",
        "\tindex=df.index",
        ")",
      ];
    }
  } else {
    let { low, high } = cfg;
    low = parseInt(low);
    high = parseInt(high);
    if (!_.isNaN(low) && !_.isNaN(high) && low > high) {
      return null;
    }
    if (cfg.type === "int") {
      return `pd.Series(np.random.randint(${low || 0}, high=${high || 100}, size=len(df)), index=df.index)`;
    } else {
      return `pd.Series(np.random.uniform(${low || 0}, high=${(high || 1) - 1}, size=len(df)), index=df.index)`;
    }
  }
}

export { buildRandomCode };
