import { ReactWrapper } from 'enzyme';
import { act } from 'react-dom/test-utils';

import CreateColumn from '../../../popups/create/CreateColumn';

export const clickBuilder = async (result: ReactWrapper, name: string): Promise<ReactWrapper> => {
  const buttonRow = result
    .find(CreateColumn)
    .find('div.form-group')
    .findWhere((row: ReactWrapper) => row.find('button').findWhere((b) => b.text() === name) !== undefined);
  await act(async () => {
    buttonRow
      .find('button')
      .findWhere((b) => b.text() === name)
      .first()
      .simulate('click');
  });
  return result.update();
};
