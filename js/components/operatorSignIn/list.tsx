import { lookupDisplayName, useEmployees } from "../../hooks/useEmployees";
import { useSignins } from "../../hooks/useSignIns";
import { HeavyRailLine } from "../../types";
import { DateTime } from "luxon";
import { ReactElement } from "react";

export const List = ({ line }: { line: HeavyRailLine }): ReactElement => {
  const employees = useEmployees();
  const signIns = useSignins(line);

  if (signIns.status === "loading" || employees.status === "loading") {
    return <>Loading...</>;
  } else if (signIns.status === "error") {
    return <>Error retrieving signins: {signIns.error}</>;
  } else if (employees.status === "error") {
    return <>Error retrieving employees: {employees.error}</>;
  }

  return (
    <table className="break-words">
      <colgroup>
        <col className="w-1/3" />
        <col className="w-1/5" />
        <col className="w-1/5" />
        <col />
      </colgroup>
      <tbody>
        <tr className="font-semibold">
          <td className="border p-1">Name</td>
          <td className="border p-1">Badge</td>
          <td className="border p-1">Time</td>
          <td className="border p-1">Official</td>
        </tr>
        {signIns.result.map((si, idx) => (
          <tr key={idx}>
            <td className="border p-1">
              {lookupDisplayName(si.signed_in_employee, employees.result)}
            </td>
            <td className="border p-1">{si.signed_in_employee}</td>
            <td className="border p-1">
              {si.signed_in_at
                .toLocaleString(DateTime.TIME_SIMPLE)
                .replace(/ /g, "")}
            </td>
            <td className="border p-1">{si.signed_in_by_user}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
