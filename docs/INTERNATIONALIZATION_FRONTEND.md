# I updated 133 jsx files w/ react-i18next and lived to tell the tale...

A while back I was asked to update my free software, [D-Tale](https://github.com/man-group/dtale), so that it could support multiple languages (Chinese in particular). This request sat in my to-do list for months because I knew it would be a big undertaking.  Luckily for me the open-source community offered to give me a head start. A branch had been created which started the process of integrating `react-i18next` into my components but with the speed at which changes are made to my software it would have been impossible to maintain. So I offered to take it over. Let me be clear, without the work done by this open-source good samaritan I never would have taken on this project. So once again a huge thanks to them.

Now armed with a good example of how to convert my pre-existing components to use `react-i18next` and a partial Chinese translation of the text in my software I began my trek updating 133 jsx files worth of React components & utility functions (not including unit tests). Here's how I accomplished this feat:

### Install Dependencies
```cmd
yarn add i18next
yarn add react-i18next
```

### Build the i18 entrypoint

This is from my file [i18n.js](https://github.com/man-group/dtale/blob/master/static/i18n.js)

```js
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import app from "./reducers/dtale";
import en from "./translations/en.json";
import cn from "./translations/cn.json";

const language = app.getHiddenValue("language") || "en";

i18n.use(initReactI18next).init({
  resources: { en, cn },
  lng: language,
  fallbackLng: "en",
  keySeparator: false,
  react: {
    useSuspense: false,
  },
  debug: process.env.NODE_ENV !== "production",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
```

To give you a little more context on my software, it's a python flask application for visualizing pandas dataframes. I have the declaration at the top `app.getHiddenValue("language")` so that I can store the selected language on the back-end so it will be persisted through browser refreshes. For the purposes of this tutorial you can ignore it and assume our language is `"en"`;

Using the `debug` flag was invaluable to validating my mapping of text so I'd advise you use it when starting out, but definitely turn it off in production scenarios.

### Setup our translation files

If you couldn't tell from our `i18n.js` file I created a `translations` folder containing my JSON language mappings. Mine contains the following:
* en.json (English)
* cn.json (Chinese)

Here's a snippet of the English file:

```json
{
  "labels": {
    "Name": "Name"
  }
}
```

Here's a snippet of the Chinese file:

```json
{
  "labels": {
    "Name": "名字"
  }
}
```

The key `menu` is so that we can limit the scope of text mappings we assign to a specific component.  You could always eliminate this by only having one main key which is used by every one of your components.

### Updating components to use `react-i18next`

The following examples show how to update react & redux components to use `react-i18next`. Both of these components are performing the same function, displaying a name with the label "Name:" before it.  We'll wrap the components in the `withTranslation` function and import the contents of the mappings in the `labels` section of one of our translation files.  For example, if the selected language is "en" and the value of the `name` property is "John Doe" then the output of these components will be "Name: John Doe".

#### React Component

```jsx
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";

class NameLabel extends React.Component {
  render() {
    const { name, text } = this.props;
    return <span>{`${text("Name")}: ${name}`}</span>;
  }
}
NameLabel.propTypes = { name: PropTypes.string, text: PropTypes.func };
export default withTranslation("labels")(NameLabel);
```


### Redux Component

```jsx
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { connect } from "react-redux";

class ReactNameLabel extends React.Component {
  render() {
    const { name, text } = this.props;
    return <span>{`${text("Name")}: ${name}`}</span>;
  }
}
ReactNameLabel.propTypes = { name: PropTypes.string, text: PropTypes.func };
const TranslateNameLabel = withTranslation("labels")(ReactNameLabel);
const ReduxNameLabel = connect(({ name }) => ({ name }))(TranslateNameLabel);
export { ReduxNameLabel as NameLabel };
```

## Lastly, adding the ability to toggle which language we're viewing

This component just renders a simple bootstrap button group for each available language in your i18n configuration. The i18n object provides some very helpful information & functions:
* `language` -> the currently selected language
* `options.resources` -> returns the object containing the languages we loaded into i18n.js earlier
* `changeLanguage(language)` -> passing one of the available languages to this function will update the selected language in your application
 
```jsx
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";

class LanguageToggle extends React.Component {
  render() {
    const { t, i18n } = this.props;
    return (
      <div className="btn-group compact">
        {Object.keys(i18n.options.resources).map((language) => (
          <button
            key={language}
            onClick={() => i18n.changeLanguage(language)}
            className={`btn btn-primary${i18n.language === language ? " active" : ""}`}
          >
            {language.toUpperCase()}
          </button>
        ))}
      </div>
    );
  }
}
LanguageToggle.propTypes = { t: PropTypes.func, i18n: PropTypes.object };
export default withTranslation("labels")(LanguageToggle);
```

Seems easy, right?  It actually is, just a little repetitive if you have a large application with a lot of text.

I hope this tutorial helped and please point out any mistakes or recommendations for improvement. If you liked this please support open-source and put your :star: on this repo. Thanks.