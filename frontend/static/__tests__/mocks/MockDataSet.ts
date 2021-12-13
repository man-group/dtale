import { Node } from 'vis-network/standalone/umd/vis-network.min';

/** Mock vis-network DataSet */
export class MockDataSet {
  /**
   * Mocked node getter
   *
   * @return mocked node
   */
  public get(): Record<string, Node> {
    return { b: { label: 'b' }, c: { label: 'c' } };
  }
}
