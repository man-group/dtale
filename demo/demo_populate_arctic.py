import arctic
import pandas as pd

conn = arctic.Arctic('mongo')
conn.initialize_library('dtale_demo', lib_type='ChunkStoreV1')

df = pd.DataFrame({'date': [pd.to_datetime('20190910'), pd.to_datetime('20190910')], 'values': [11, 99]})
print(df.to_string())

lib = arctic.Arctic('mongo')['dtale_demo']
lib.write('test/data_symbol', df)
