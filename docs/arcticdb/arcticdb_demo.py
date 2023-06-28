from arcticdb import Arctic
import pandas as pd
import dtale.global_state as global_state
from dtale.app import build_app

uri = 'lmdb:///users/is/anschonfel/test_db'
conn = Arctic(uri)
libs = conn.list_libraries()
if 'lib1' not in libs:
    conn.create_library('lib1')
lib1 = conn['lib1']
lib1_symbols = lib1.list_symbols()
if 'symbol1' not in lib1_symbols:
    lib1.write('symbol1', pd.DataFrame([
        {'col1': 1, 'col2': 1.1, 'col3': pd.Timestamp('20230101')}
    ]))
if 'symbol2' not in lib1_symbols:
    lib1.write('symbol2', pd.DataFrame([
        {'col1': 2, 'col2': 2.2, 'col3': pd.Timestamp('20230102')}
    ]))

if 'lib2' not in libs:
    conn.create_library('lib2')
lib2 = conn['lib2']
lib2_symbols = lib2.list_symbols()
if 'symbol3' not in lib2_symbols:
    lib2.write('symbol3', pd.DataFrame([
        {'col1': 3, 'col2': 3.3, 'col3': pd.Timestamp('20230103')}
    ]))
if 'symbol4' not in lib2_symbols:
    lib2.write('symbol4', pd.DataFrame([
        {'col1': 4, 'col2': 4.4, 'col3': pd.Timestamp('20230104')},
        {'col1': 5, 'col2': 5.5, 'col3': pd.Timestamp('20230105')},
        {'col1': 6, 'col2': 6.6, 'col3': pd.Timestamp('20230106')},
        {'col1': 7, 'col2': 7.7, 'col3': pd.Timestamp('20230107')}
    ]))

if 'lib3' not in libs:
    conn.create_library('lib3')
lib3 = conn['lib3']
lib3_symbols = lib3.list_symbols()
if 'symbol5' not in lib3_symbols:
    lib3.write('symbol5', pd.DataFrame(
        {'col{}'.format(i): list(range(1000)) for i in range(105)}
    ))

global_state.use_arcticdb_store(uri=uri)
app = build_app(reaper_on=False)

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=9207)
