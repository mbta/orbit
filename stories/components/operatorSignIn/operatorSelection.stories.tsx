import { OperatorSelection } from "../../../js/components/operatorSignIn/operatorSelection";
import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta<typeof OperatorSelection> = {
  component: OperatorSelection,
};

export default meta;
type Story = StoryObj<typeof OperatorSelection>;

export const Primary: Story = {
  args: { nfcSupported: true },
};
