defmodule Orbit.Ocs.Message do
  # Only include TSCH message types for now
  @type t ::
          Orbit.Ocs.Message.TschNewMessage.t()
          | Orbit.Ocs.Message.TschConMessage.t()
          | Orbit.Ocs.Message.TschAsnMessage.t()
          | Orbit.Ocs.Message.TschRldMessage.t()
          | Orbit.Ocs.Message.TschDstMessage.t()
          | Orbit.Ocs.Message.TschDelMessage.t()
          | Orbit.Ocs.Message.TschLnkMessage.t()
          | Orbit.Ocs.Message.TschOffMessage.t()
          | Orbit.Ocs.Message.TschTagMessage.t()
end
