import CodeBlock from "@/components/CodeBlock";
import { useCodePreference } from "@/lib/preferences";

export interface CodeTabsProps {
  /** extra classes on the wrapper; named `class` because that is what the Svelte component exported */
  class?: string;
  js?: string;
  dart?: string;
  go?: string;
  group?: string; // preferences group key
}

export default function CodeTabs({
  class: classes = "m-t-10 m-b-base",
  js = "",
  dart = "",
  go = "",
  group = "",
}: CodeTabsProps) {
  const [preference, setPreference] = useCodePreference(group);

  const tabs = [
    {
      title: "Go",
      language: "go",
      content: go,
    },
    {
      title: "JavaScript",
      language: "javascript",
      content: js,
    },
    {
      title: "Dart",
      language: "dart",
      content: dart,
    },
  ];

  const nonEmptyTabs = tabs.filter((item) => item.content != "");

  const activeLanguage =
    nonEmptyTabs.find((item) => item.language == preference)?.language || nonEmptyTabs?.[0]?.language;

  return (
    <div className={`tabs code-tabs ${classes}`}>
      <div className="tabs-header compact combined left">
        {nonEmptyTabs.map((tab) => (
          <button
            key={tab.language}
            className={`tab-item${activeLanguage === tab.language ? " active" : ""}`}
            onClick={() => setPreference(tab.language)}
          >
            <div className="txt">{tab.title}</div>
          </button>
        ))}
      </div>
      <div className="tabs-content">
        {nonEmptyTabs.map((tab) => (
          <div key={tab.language} className={`tab-item${activeLanguage === tab.language ? " active" : ""}`}>
            <CodeBlock language={tab.language} content={tab.content} />
          </div>
        ))}
      </div>
    </div>
  );
}
