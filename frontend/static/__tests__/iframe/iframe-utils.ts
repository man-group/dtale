import { act, fireEvent, screen } from '@testing-library/react';

export const findColMenuButton = (name: string, btnTag = 'button'): Element => {
  const buttons = [...document.getElementById('column-menu-div')!.querySelectorAll(`ul li ${btnTag}`)];
  return buttons.find((b) => b.textContent?.includes(name))!;
};

export const clickColMenuButton = async (name: string, btnTag = 'button'): Promise<void> => {
  await act(async () => {
    await fireEvent.click(findColMenuButton(name, btnTag));
  });
};

export const clickColMenuSubButton = async (label: string, row = 0): Promise<void> => {
  await act(async () => {
    const buttons = [
      ...document
        .getElementById('column-menu-div')!
        .querySelectorAll(`ul li div.column-sorting`)
        [row].getElementsByTagName('button'),
    ];
    const button = buttons.find((b) => b.innerHTML.includes(label))!;
    await fireEvent.click(button);
  });
};

export const openColMenu = async (colIdx: number): Promise<void> => {
  await act(async () => {
    await fireEvent.click(screen.queryAllByTestId('header-cell')[colIdx].getElementsByClassName('text-nowrap')[0]);
  });
};

export const validateHeaders = (headers: string[], headerCells?: Element[]): void => {
  expect(
    (headerCells ?? screen.queryAllByTestId('header-cell')).map(
      (hc) => hc.getElementsByClassName('text-nowrap')[0].textContent,
    ),
  ).toEqual(headers);
};
