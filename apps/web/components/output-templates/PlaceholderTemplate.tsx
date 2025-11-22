interface PlaceholderTemplateProps {
  outputType: string;
}

export function PlaceholderTemplate({ outputType }: PlaceholderTemplateProps) {
  return (
    <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
      <div className="text-4xl mb-3">🚧</div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        Template Coming Soon
      </h3>
      <p className="text-gray-600 dark:text-gray-400 font-medium">
        The {outputType} template is under development.
      </p>
    </div>
  );
}
