defmodule OCS.Message do
  # Only include TSCH message types for now
  @type t ::
          OCS.Message.TschNewMessage.t()
          | OCS.Message.TschConMessage.t()
          | OCS.Message.TschAsnMessage.t()
          | OCS.Message.TschRldMessage.t()
          | OCS.Message.TschDstMessage.t()
          | OCS.Message.TschDelMessage.t()
          | OCS.Message.TschLnkMessage.t()
          | OCS.Message.TschOffMessage.t()
          | OCS.Message.TschTagMessage.t()
end
