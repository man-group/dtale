import mock
import pandas as pd
import pandas.util.testing as pdt
import pytest

from tests import ExitStack


@pytest.mark.unit
def test_show_colab(unittest, builtin_pkg):
    from dtale.app import show, get_instance, instances
    import dtale.views as views
    import dtale.global_state as global_state

    orig_import = __import__
    mock_eval_js = mock.Mock()
    mock_eval_js.eval_js = lambda _port: "http://colab_host"

    def import_mock(name, *args, **kwargs):
        if name == "google.colab.output":
            return mock_eval_js
        return orig_import(name, *args, **kwargs)

    test_data = pd.DataFrame([dict(a=1, b=2)])
    with ExitStack() as stack:
        stack.enter_context(
            mock.patch("{}.__import__".format(builtin_pkg), side_effect=import_mock)
        )
        stack.enter_context(mock.patch("dtale.app.USE_COLAB", True))
        stack.enter_context(mock.patch("dtale.app.ACTIVE_PORT", 40000))
        stack.enter_context(mock.patch("dtale.app.ACTIVE_HOST", "localhost"))
        mock_run = stack.enter_context(
            mock.patch("dtale.app.DtaleFlask.run", mock.Mock())
        )
        stack.enter_context(
            mock.patch("dtale.app.is_up", mock.Mock(return_value=False))
        )
        mock_requests = stack.enter_context(mock.patch("requests.get", mock.Mock()))
        instance = show(
            data=test_data, subprocess=False, name="foo", ignore_duplicate=True
        )
        assert "http://colab_host" == instance._url
        mock_run.assert_called_once()

        pdt.assert_frame_equal(instance.data, test_data)
        tmp = test_data.copy()
        tmp["biz"] = 2.5
        instance.data = tmp
        unittest.assertEqual(
            global_state.get_dtypes(instance._data_id),
            views.build_dtypes_state(tmp),
            "should update app data/dtypes",
        )

        instance2 = get_instance(instance._data_id)
        assert instance2._url == instance._url
        instances()

        assert get_instance(20) is None  # should return None for invalid data ids

        instance.kill()
        mock_requests.assert_called_once()
        assert mock_requests.call_args[0][0] == "http://colab_host/shutdown"


@pytest.mark.unit
def test_failing_show_colab():
    from dtale.app import show

    with ExitStack() as stack:
        stack.enter_context(mock.patch("dtale.app.USE_COLAB", True))
        stack.enter_context(mock.patch("dtale.app.DtaleFlask.run", mock.Mock()))
        stack.enter_context(mock.patch("dtale.app.ACTIVE_PORT", 40000))
        stack.enter_context(mock.patch("dtale.app.ACTIVE_HOST", "localhost"))
        stack.enter_context(
            mock.patch("dtale.app.is_up", mock.Mock(return_value=False))
        )
        stack.enter_context(mock.patch("requests.get", mock.Mock()))
        instance = show(data=pd.DataFrame([1, 2, 3]))
        assert "http://localhost:40000" == instance._url
