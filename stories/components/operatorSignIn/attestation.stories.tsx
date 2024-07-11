import { Attestation } from "../../../js/components/operatorSignIn/attestation";
import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta<typeof Attestation> = {
  component: Attestation,
};

export default meta;
type Story = StoryObj<typeof Attestation>;

export const Primary: Story = {};
