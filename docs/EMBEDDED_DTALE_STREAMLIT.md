# Using D-Tale within Streamlit

**1)** Either install Streamlit directly or using the D-Tale extra:
- `pip install streamlit`
- `pip install dtale[streamlit]`

**2)** Invoke your Streamlit script using the `dtale-streamlit` command instead of the `streamlit` command:
- `dtale-streamlit run my_streamlit_script.py`

### Updating your Streamlit script to use D-Tale

#### Saving data to D-Tale:
```python
import pandas as pd
from dtale.views import startup

df = pd.DataFrame([1, 2, 3, 4])
startup(data_id="1", data=df)
```

#### Retrieving data from D-Tale
```python
from dtale.app import get_instance

# remember we set the data_id of our previous dataframe was "1"
df = get_instance("1").data
```
This will allow you to gain access to any dataframe you've passed to D-Tale (assuming you've remembered the `data_id`)

#### Retireving data on the front end for display in `<iframe>`
````html
<iframe src="/dtale/main/1" />
````
This will display the standard D-Tale grid which you can perform any D-Tale operation on.

#### Creating links to open D-Tale in new tab
```html
<a href="/dtale/main/1" target="_blank">Dataframe 1</a>
```

Here's a demo of a couple ways to use D-Tale within Streamlit
[![](http://img.youtube.com/vi/iiT8fQqj4no/0.jpg)](http://www.youtube.com/watch?v=iiT8fQqj4no "D-Tale Streamlit")

And here's the source code of the two examples in that clip:
- [Altering a Dataframe](https://github.com/man-group/dtale/blob/master/docs/streamlit/script_columns_and_code.py)
- [Scraping baseball-reference.com](https://github.com/man-group/dtale/blob/master/docs/streamlit/script_baseball.py)

Hope this leads to lots of new ideas of how Flask can be used within Streamlit! Please support open-source by putting your :star: on this repo!