import pytest


@pytest.mark.unit
def test_instance_creation_w_bad_symbol(unittest, arcticdb_path, arcticdb):
    pytest.importorskip("arcticdb")

    from dtale.global_state import DtaleArcticDB

    with pytest.raises(ValueError):
        db = DtaleArcticDB(arcticdb_path)
        db.build_instance("dtale|bad_symbol")
