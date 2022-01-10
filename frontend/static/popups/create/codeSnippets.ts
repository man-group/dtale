import { CreateColumnCodeSnippet } from './CodeSnippet';
import { CleaningConfig, RandomConfigs, RandomType } from './CreateColumnState';

export const buildRandomCode = (cfg: RandomConfigs): CreateColumnCodeSnippet => {
  switch (cfg.type) {
    case RandomType.STRING: {
      return [
        'pd.Series(',
        "\t[''.join(random.choice(chars) for _ in range(length)) for _ in range(len(df)]),",
        '\tindex=df.index',
        ')',
      ];
    }
    case RandomType.CHOICE:
      return `pd.Series(np.random.choice(['${(cfg.choices || 'a,b,c,d,e,f')
        .split(',')
        .join("','")}'], len(df)), index=df.index)`;
    case RandomType.BOOL:
      return 'pd.Series(np.random.choice([True, False], len(data)), index=df.index)';
    case RandomType.DATE: {
      const start = cfg.start ?? '19000101';
      const end = cfg.end ?? '21991231';
      if (cfg.timestamps) {
        return [
          'def pp(start, end, n):',
          '\tstart_u = start.value // 10 ** 9',
          '\tend_u = end.value // 10 ** 9',
          '\treturn pd.DatetimeIndex(',
          "\t\t10 ** 9 * np.random.randint(start_u, end_u, n)).view('M8[ns]')",
          '\t)',
          '',
          `pp(pd.Timestamp('${start}'), pd.Timestamp('${end}'), len(df))`,
        ];
      } else {
        const freq = cfg.businessDay ? ", freq='B'" : '';
        return [
          `dates = pd.date_range('${start}', '${end}'${freq}).to_list()`,
          'pd.Series(',
          '\t[dates[i] for i in np.random.randint(0, len(dates) - 1, size=len(df))],',
          '\tindex=df.index',
          ')',
        ];
      }
    }
    case RandomType.INT:
    case RandomType.FLOAT: {
      const low = cfg.low ? parseInt(cfg.low, 10) : undefined;
      const high = cfg.high ? parseInt(cfg.high, 10) : undefined;
      if (low !== undefined && high !== undefined && !isNaN(low) && !isNaN(high) && low > high) {
        return undefined;
      }
      if (cfg.type === RandomType.INT) {
        return `pd.Series(np.random.randint(${cfg.low ?? 0}, high=${high ?? 100}, size=len(df)), index=df.index)`;
      } else {
        return `pd.Series(np.random.uniform(${cfg.low ?? 0}, high=${high ?? 1}, size=len(df)), index=df.index)`;
      }
    }
    default:
      return undefined;
  }
};

export const buildCleaningCode = (cfg: CleaningConfig): CreateColumnCodeSnippet => {
  if (!cfg.col) {
    return undefined;
  }
  let code = [`s = df['${cfg.col}']`];
  cfg.cleaners.forEach((cleaner) => {
    if (cleaner === 'drop_multispace') {
      code.push("s = s.str.replace(r'[ ]+', ' ')");
    } else if (cleaner === 'drop_punctuation') {
      code.push("s = s.apply(lambda x: x.translate(str.maketrans('', '', string.punctuation))");
    } else if (cleaner === 'stopwords') {
      const stopwords = (cfg.stopwords ?? []).join("','");
      code = code.concat([
        'def clean_stopwords(x):',
        `\treturn ' '.join([w for w in x.split(' ') if w not in ['${stopwords}'])`,
        's = s.apply(clean_stopwords)',
      ]);
    } else if (cleaner === 'nltk_stopwords') {
      code = code.concat([
        'import nltk\n',
        "nltk.download('stopwords')",
        "nltk.download('punkt')\n",
        `nltk_stopwords_set = set(nltk.corpus..words('${cfg.language ?? 'english'}'))\n`,
        'def clean_nltk_stopwords(x):',
        "\treturn ' '.join(",
        '\t\t[w for w in nltk.tokenize.word_tokenize(x) if w not in nltk_stopwords_set]',
        '\t)',
        's = s.apply(clean_nltk_stopwords)',
      ]);
    } else if (cleaner === 'drop_numbers') {
      code.push(`s = s.str.replace(r'[\\d]+', '')`);
    } else if (cleaner === 'keep_alpha') {
      code.push(`s = s.apply(lambda x: ''.join(c for c in x if c.isalpha()))`);
    } else if (cleaner === 'normalize_accents') {
      code = code.concat([
        'import unicodedata\n',
        's = s.apply(',
        "\tlambda x: unicodedata.normalize('NFKD', u'{}'.format(x)).encode('ASCII', 'ignore').decode('utf-8')",
        ')',
      ]);
    } else if (cleaner === 'drop_all_space') {
      code.push(`s = s.str.replace(r'[ ]+', '')`);
    } else if (cleaner === 'drop_repeated_words') {
      code = code.concat([
        'def drop_repeated_words(val):',
        '\tdef _load():',
        "\t\tval_segs = val.split(' ')",
        '\t\t\tfor i, v2 in enumerate(val_segs):',
        '\t\t\t\tif i == 0:',
        '\t\t\t\t\tyield v2',
        '\t\t\t\telif val_segs[i - 1] != v2:',
        '\t\t\t\t\tyield v2',
        "\treturn ' '.join(list(_load()))",
        's = s.apply(drop_repeated_words)',
      ]);
    } else if (cleaner === 'add_word_number_space') {
      code.push(`s = s.str.replace(r'(\\d+(\\.\\d+)?)', r' \\1 ')`);
    } else if (cleaner === 'drop_repeated_chars') {
      code = code.concat([
        'def drop_repeated_chars(val):',
        '\tdef _load():',
        '\t\tfor i, v2 in enumerate(val):',
        '\t\t\tif i == 0:',
        '\t\t\t\tyield v2',
        '\t\t\telif val[i - 1] != v2:',
        '\t\t\t\tyield v2',
        "\treturn ''.join(list(_load()))",
        's = s.apply(drop_repeated_chars)',
      ]);
    } else if (cleaner === 'update_case' && cfg.caseType) {
      code.push(`s = s.str.${cfg.caseType}()`);
    } else if (cleaner === 'space_vals_to_empty') {
      code.push(`s = s.str.replace(r'[ ]+', '')`);
    } else if (cleaner === 'hidden_chars') {
      code.push("printable = r'\\w \\!\\\"#\\$%&\\'\\(\\)\\*\\+,\\-\\./:;<»«؛،ـ\\=>\\?@\\[\\\\\\]\\^_\\`\\{\\|\\}~'");
      code.push("s = s.str.replacer(r'[^{}]+'.format(printable), '')");
    } else if (cleaner === 'replace_hyphen_w_space') {
      code.push("s = s.str.replacer(s.str.replace(r'[‐᠆﹣－⁃−\\-]+', ' ')");
    }
  });
  return code;
};
