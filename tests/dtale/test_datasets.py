import mock
import pandas as pd
import pytest

from dtale.app import build_app

URL = "http://localhost:40000"


@pytest.mark.unit
def test_load_zip():
    """Test load_zip function with mocked HTTP request."""
    import zipfile
    from io import BytesIO

    # Create a real zip file in memory
    zip_buffer = BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("test.csv", "a,b,c\n1,2,3\n4,5,6")
    zip_buffer.seek(0)

    mock_response = mock.Mock()
    mock_response.content = zip_buffer.read()

    with mock.patch("dtale.datasets.requests.get", return_value=mock_response):
        from dtale.datasets import load_zip

        results = list(load_zip("http://test.com/test.zip"))
        assert len(results) == 1
        assert results[0][0] == "test.csv"


@pytest.mark.unit
def test_simpsons_dataset():
    """Test simpsons dataset loader with mocked dependencies."""
    import dtale.global_state as global_state

    episodes_df = pd.DataFrame(
        {
            "id": [1, 2],
            "title": ["ep1", "ep2"],
            "image_url": ["http://img1.png", "http://img2.png"],
        }
    )
    scripts_df = pd.DataFrame({"episode_id": [1, 2], "line": ["hello", "world"]})

    def mock_load_csv(**kwargs):
        return episodes_df

    def mock_load_zip(url):
        yield "scripts.csv", None

    with mock.patch(
        "dtale.datasets.load_csv", create=True
    ) as mock_csv, mock.patch(
        "dtale.datasets.load_zip", return_value=iter([("scripts.csv", None)])
    ) as mock_zip, mock.patch(
        "dtale.cli.loaders.csv_loader.loader_func", return_value=episodes_df
    ), mock.patch(
        "pandas.read_csv", return_value=scripts_df
    ):
        from dtale.datasets import simpsons

        df, settings = simpsons()
        assert df is not None
        assert settings is not None
        assert "columnFormats" in settings
        assert "image_url" in settings["columnFormats"]


@pytest.mark.unit
def test_video_games_dataset():
    """Test video_games dataset loader with mocked load_zip."""
    games_df = pd.DataFrame({"name": ["Game1"], "sales": [100]})

    with mock.patch(
        "dtale.datasets.load_zip",
        return_value=iter([("vgsales.csv", None)]),
    ), mock.patch("pandas.read_csv", return_value=games_df):
        from dtale.datasets import video_games

        df, settings = video_games()
        assert df is not None
        assert settings is None
        assert "name" in df.columns


@pytest.mark.unit
def test_movies_dataset():
    """Test movies dataset loader with mocked load_zip."""
    movies_df = pd.DataFrame(
        {"title": ["Movie1", "Movie2"], "year": ["2019", "TV Movie 2019"]}
    )

    with mock.patch(
        "dtale.datasets.load_zip",
        return_value=iter([("movies.csv", None)]),
    ), mock.patch("pandas.read_csv", return_value=movies_df):
        from dtale.datasets import movies

        df, settings = movies()
        assert df is not None
        assert settings is None
        # The "TV Movie 2019" should be replaced with 2019
        assert list(df["year"]) == [2019, 2019]
