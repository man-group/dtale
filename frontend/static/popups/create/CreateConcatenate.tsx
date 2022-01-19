import { TFunction } from 'i18next';
import * as React from 'react';

import { CreateColumnCodeSnippet } from './CodeSnippet';
import {
  BaseCreateComponentProps,
  ConcatenationConfig,
  CreateColumnType,
  NumericOperationType,
  OperandDataType,
} from './CreateColumnState';
import { validateNumericCfg } from './CreateNumeric';
import { default as Operand, OperandState } from './Operand';

export const validateConcatenateCfg = (t: TFunction, cfg: ConcatenationConfig): string | undefined => {
  return validateNumericCfg(t, { ...cfg, operation: NumericOperationType.SUM });
};

export const buildCode = (left: OperandState, right: OperandState): CreateColumnCodeSnippet => {
  let code = '';
  if (left.type === OperandDataType.COL) {
    const col = left.col?.value;
    if (!col) {
      return undefined;
    }
    code += `df['${col}'].astype('str')`;
  } else {
    if (!left.val) {
      return undefined;
    }
    code += `'${left.val}'`;
  }
  code += ' + ';
  if (right.type === OperandDataType.COL) {
    const col = right.col?.value;
    if (!col) {
      return undefined;
    }
    code += `df['${col}'].astype('str')`;
  } else {
    if (!right.val) {
      return undefined;
    }
    code += `'${right.val}'`;
  }
  return code;
};

export const CreateConcatenate: React.FC<BaseCreateComponentProps> = ({ updateState, columns }) => {
  const [left, setLeft] = React.useState<OperandState>({ type: OperandDataType.COL });
  const [right, setRight] = React.useState<OperandState>({ type: OperandDataType.COL });

  React.useEffect(() => {
    const cfg: ConcatenationConfig = {
      left: {
        type: left.type,
        col: left.type === OperandDataType.COL ? left.col?.value : undefined,
        val: left.type === OperandDataType.VAL ? left.val : undefined,
      },
      right: {
        type: right.type,
        col: right.type === OperandDataType.COL ? right.col?.value : undefined,
        val: right.type === OperandDataType.VAL ? right.val : undefined,
      },
    };
    updateState({ cfg: { type: CreateColumnType.CONCATENATE, cfg }, code: buildCode(left, right) });
  }, [left, right]);

  return (
    <React.Fragment>
      <Operand
        name="left"
        cfg={left}
        otherOperand={right}
        dataType="text"
        updateState={(updates) => setLeft({ ...left, ...updates.left })}
        columns={columns}
      />
      <Operand
        name="right"
        cfg={right}
        otherOperand={left}
        dataType="text"
        updateState={(updates) => setRight({ ...right, ...updates.right })}
        columns={columns}
      />
    </React.Fragment>
  );
};
