import mock
import pytest

from tests import ExitStack


@pytest.mark.unit
def test_path_dispatcher():
    prefixes = ["foo", "bar"]

    def mock_peek_path_info(_base):
        if len(prefixes):
            return prefixes.pop(0)
        return "bar"

    with ExitStack() as stack:
        mock_peek = stack.enter_context(
            mock.patch(
                "dtale.django.dispatcher.peek_path_info",
                mock.Mock(side_effect=mock_peek_path_info),
            )
        )
        mock_pop_path_info = stack.enter_context(
            mock.patch("dtale.django.dispatcher.pop_path_info", mock.Mock())
        )

        from dtale.django.dispatcher import PathDispatcher

        default_app = mock.MagicMock()
        created_app = mock.MagicMock()

        def create_app(prefix):
            if prefix == "foo":
                return created_app

        dispatcher = PathDispatcher(default_app, create_app)
        mock_environ = mock.Mock()
        mock_start_response = mock.Mock()
        dispatcher(mock_environ, mock_start_response)

        assert mock_peek.called
        assert mock_pop_path_info.called
        assert "foo" in dispatcher.instances
        assert not default_app.called
        created_app.assert_called_once_with(mock_environ, mock_start_response)
        mock_pop_path_info.reset_mock()
        mock_peek.reset_mock()
        created_app.reset_mock()

        mock_environ = mock.Mock()
        mock_start_response = mock.Mock()
        dispatcher(mock_environ, mock_start_response)
        assert mock_peek.called
        assert not created_app.called
        default_app.assert_called_once_with(mock_environ, mock_start_response)
