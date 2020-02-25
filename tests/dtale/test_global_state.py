import pytest


@pytest.mark.unit
def test_getters():
    import dtale.global_state as global_state

    for prop in ['data', 'dtypes', 'settings', 'metadata', 'context_variables', 'history']:
        assert getattr(global_state, 'get_{}'.format(prop))() is not None


@pytest.mark.unit
def test_cleanup_data_id():
    import dtale.global_state as global_state

    for prop in ['data', 'dtypes', 'settings', 'metadata', 'context_variables', 'history']:
        getattr(global_state, 'set_{}'.format(prop))('1', 'test')

    global_state.cleanup('1')

    for prop in ['data', 'dtypes', 'settings', 'metadata', 'context_variables', 'history']:
        assert getattr(global_state, 'get_{}'.format(prop))('1') is None
