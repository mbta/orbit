import { ReactElement } from "react";

// 🚨 You MUST change the version if you change the text!
// 🚨 You MUST update the document at https://www.notion.so/mbta-downtown-crossing/Attestation-Text-History-7f7117d7c4574013a48c6819c7809c4a?pvs=4
export const useSignInText = (): {
  version: number;
  text: ReactElement;
} => {
  return {
    version: 1,
    text: (
      <ul className="my-7 mx-5 list-disc leading-tight">
        <li>I do not have an electronic device in my possession.</li>
        <li>
          I am fit for duty, and I do not possess nor am I under the influence
          of alcohol, prohibited drugs, or non-authorized medication, whether
          prescribed or non-prescribed.
        </li>
        <li>
          I have a valid ROW Card and Certification Card in my possession.
        </li>
        <li>I have read the Day/Night Orders.</li>
        <li>I am in my MBTA uniform.</li>
        <li>I have read relevant Special Orders and announcements.</li>
      </ul>
    ),
  };
};
