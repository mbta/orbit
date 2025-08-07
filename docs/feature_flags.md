# Feature Flags

(Note: This document was copied from Glides.)

Sometimes, it's valuable to have a feature exist in the code base but not yet be accessible to all users.
We use the [Laboratory](https://github.com/paulswartz/laboratory/tree/cookie_opts) Elixir library for managing feature flags.
(Specifically, we use a fork that adds support for CSRF tokens, so that `Plug.CSRFProtection` doesn't reject all the form submissions.)

## Creating

A new feature should be added behind a feature flag if

- it needs to be hidden but accessible in production, for user testing or for some other reason
- it might spend some time incomplete on the `main` branch and needs to be invisible if `main` gets deployed to production during that time

New feature flags are added in `config/config.exs`:

```elixir
config :laboratory,
  features: [
    # {:feature_name, "Feature Name", "Feature description"}
    {:example, "An Example", "Some example feature"}
  ]
```

## Using

From Elixir, code can check if a feature flag is enabled with `Laboratory.enabled?(conn, :example)`.
From JS, code can check if a feature flag is enabled with `isFeatureEnabled("example")`.
Users can adjust feature flags from `/_flags` once they're logged in.

## Removing

When the pull request that creates a feature flag is merged, an Asana task to remove the feature flag should also be created.
Any outstanding issues with the feature or research to be done while the feature is behind the flag should be set as dependencies blocking the feature flag removal.
Once all known issues have been resolved and the team is satisfied that the feature is ready to be rolled out, the feature flag can be removed from the Elixir config, and any conditional logic for the feature flag can be made unconditional.
