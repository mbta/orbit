import { createContext, ReactNode, useContext, useState } from "react";

export type DataWarning = "vehicle_positions_stale";
export type DataWarnings = Set<DataWarning>;

const DataWarningsContext = createContext<
  [DataWarnings, (warning: DataWarning) => void, (warning: DataWarning) => void]
>([
  new Set(),
  (warning) => {
    throw Error("Not implemented");
  },
  (warning) => {
    throw Error("Not implemented");
  },
]);
export const DataWarningsProvider = ({ children }: { children: ReactNode }) => {
  const [warnings, setWarnings] = useState<DataWarnings>(new Set());
  const addWarning: (warning: DataWarning) => void = (warning: DataWarning) => {
    setWarnings((warnings) => warnings.add(warning));
  };
  const removeWarning: (warning: DataWarning) => void = (
    warning: DataWarning,
  ) => {
    setWarnings((warnings) => {
      const newSet = new Set(warnings);
      newSet.delete(warning);
      return newSet;
    });
  };

  return (
    <DataWarningsContext.Provider value={[warnings, addWarning, removeWarning]}>
      {children}
    </DataWarningsContext.Provider>
  );
};

export const useDataWarnings = () => useContext(DataWarningsContext);
