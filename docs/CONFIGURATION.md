# D-Tale Configuration

There are a lot of parameters that can be passed to the `dtale.show()` function and if you're calling this function often which similar parameters it can become quite cumbersome.  Not to fear, there is a way around this and it is via an `.ini` file.

There are two options for specifying the `.ini` file (in order of precedence):
1) create an environment variable `DTALE_CONFIG` and set it to the path to your `.ini` file
2) save your `.ini` file to `$HOME/.config/dtale.ini`

If you do make use of the `.ini` file then the `[app]` section properties will be applied to the application overall and the `[show]` section will be applied every time you call `dtale.show`.

Here is an example of the `.ini` file with all the properties available and what their defaults are (if they have one):
```ini
[app]
theme = light
github_fork = False
hide_shutdown = False
pin_menu = False
language = en
max_column_width = 100 # the default value is None
main_title = My App # only use this if you don't want to see the D-Tale logo
main_title_font = Arial # this font is applied to your custom title
query_engine = python

[charts] # this controls how many points can be contained within scatter & 3D charts
scatter_points = 15000
3d_points = 4000

[auth]
active = True
username = johndoe
password = 1337h4xOr

[show]
host = localhost
port = 8080
debug = False
reaper_on = True
open_browser = False
ignore_duplicate = True
allow_cell_edits = True
inplace = False
drop_index = False
app_root = additional_path
precision = 6 # how many digits to show on floats
show_columns = a,b
hide_columns = c
column_formats = {"a": {"fmt": {"html": true}}}
sort = a|ASC,b|DESC
locked = a,b
```

Some notes on these properties:
* *theme:* available values are 'light' & 'dark'
* *host/port/app_root:* have no default

Here is the hierarchy of how parameters are passed to `dtale.show` (in order of most important to least):
1) Passing parameters directly into `dtale.show` or passing a dictionary of settings to `dtale.global_state.set_app_settings` or `dtale.global_state.set_auth_settings`
2) Calling `dtale.config.set_config(path_to_file)` which is probably only useful if you have a long-running process like a jupyter notebook
3) Specifying an `.ini` file via `DTALE_CONFIG` environment variable
4) Specifying an `.ini` file in `$HOME/.config/dtale.ini`
