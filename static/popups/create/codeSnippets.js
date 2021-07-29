import _ from "lodash";

export function buildRandomCode(cfg) {
  if (cfg.type === "string") {
    return [
      "pd.Series(",
      "\t[''.join(random.choice(chars) for _ in range(length)) for _ in range(len(df)]),",
      "\tindex=df.index",
      ")",
    ];
  } else if (cfg.type === "choice") {
    let choices = cfg.choices || "a,b,c,d,e,f";
    choices = _.join(choices.split(","), "','");
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
      return `pd.Series(np.random.uniform(${low || 0}, high=${high || 1}, size=len(df)), index=df.index)`;
    }
  }
}

export function buildCleaningCode(cfg) {
  if (!cfg.col) {
    return null;
  }
  let code = [`s = df['${cfg.col}']`];
  _.forEach(cfg.cleaners, cleaner => {
    if (cleaner === "drop_multispace") {
      code.push("s = s.str.replace(r'[ ]+', ' ')");
    } else if (cleaner === "drop_punctuation") {
      code.push("s = s.apply(lambda x: x.translate(str.maketrans('', '', string.punctuation))");
    } else if (cleaner === "stopwords") {
      const stopwords = _.join(cfg.stopwords, "','");
      code = _.concat(code, [
        "def clean_stopwords(x):",
        `\treturn ' '.join([w for w in x.split(' ') if w not in ['${stopwords}'])`,
        "s = s.apply(clean_stopwords)",
      ]);
    } else if (cleaner === "nltk_stopwords") {
      code = _.concat(code, [
        "import nltk\n",
        "nltk.download('stopwords')",
        "nltk.download('punkt')\n",
        `nltk_stopwords_set = set(nltk.corpus..words('${cfg.language ?? "english"}'))\n`,
        "def clean_nltk_stopwords(x):",
        "\treturn ' '.join(",
        "\t\t[w for w in nltk.tokenize.word_tokenize(x) if w not in nltk_stopwords_set]",
        "\t)",
        "s = s.apply(clean_nltk_stopwords)",
      ]);
    } else if (cleaner === "drop_numbers") {
      code.push(`s = s.str.replace(r'[\\d]+', '')`);
    } else if (cleaner === "keep_alpha") {
      code.push(`s = s.apply(lambda x: ''.join(c for c in x if c.isalpha()))`);
    } else if (cleaner === "normalize_accents") {
      code = _.concat(code, [
        "import unicodedata\n",
        "s = s.apply(",
        "\tlambda x: unicodedata.normalize('NFKD', u'{}'.format(x)).encode('ASCII', 'ignore').decode('utf-8')",
        ")",
      ]);
    } else if (cleaner === "drop_all_space") {
      code.push(`s = s.str.replace(r'[ ]+', '')`);
    } else if (cleaner === "drop_repeated_words") {
      code = _.concat(code, [
        "def drop_repeated_words(val):",
        "\tdef _load():",
        "\t\tval_segs = val.split(' ')",
        "\t\t\tfor i, v2 in enumerate(val_segs):",
        "\t\t\t\tif i == 0:",
        "\t\t\t\t\tyield v2",
        "\t\t\t\telif val_segs[i - 1] != v2:",
        "\t\t\t\t\tyield v2",
        "\treturn ' '.join(list(_load()))",
        "s = s.apply(drop_repeated_words)",
      ]);
    } else if (cleaner === "add_word_number_space") {
      code.push(`s = s.str.replace(r'(\\d+(\\.\\d+)?)', r' \\1 ')`);
    } else if (cleaner === "drop_repeated_chars") {
      code = _.concat(code, [
        "def drop_repeated_chars(val):",
        "\tdef _load():",
        "\t\tfor i, v2 in enumerate(val):",
        "\t\t\tif i == 0:",
        "\t\t\t\tyield v2",
        "\t\t\telif val[i - 1] != v2:",
        "\t\t\t\tyield v2",
        "\treturn ''.join(list(_load()))",
        "s = s.apply(drop_repeated_chars)",
      ]);
    } else if (cleaner === "update_case" && cfg.caseType) {
      code.push(`s = s.str.${cfg.caseType}()`);
    } else if (cleaner === "space_vals_to_empty") {
      code.push(`s = s.str.replace(r'[ ]+', '')`);
    } else if (cleaner === "hidden_chars") {
      code.push("printable = r'\\w \\!\\\"#\\$%&\\'\\(\\)\\*\\+,\\-\\./:;<»«؛،ـ\\=>\\?@\\[\\\\\\]\\^_\\`\\{\\|\\}~'");
      code.push("s = s.str.replacer(r'[^{}]+'.format(printable), '')");
    } else if (cleaner === "replace_hyphen_w_space") {
      code.push("s = s.str.replacer(s.str.replace(r'[‐᠆﹣－⁃−\\-]+', ' ')");
    }
  });
  return code;
}
