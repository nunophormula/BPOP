const { Form, Input, Card, Table, Typography } = antd;
const { Title, Text } = Typography;

/* =========================
   Render genérico (recursivo)
========================= */

function RenderNode({ node, path = [] }) {
  if (!node) return null;

  switch (node.level) {
    case "title":
      return (
        <Card className="mb-6 border-2 border-gray-300">
          <Title level={3} className="!mb-4">
            {node.text}
          </Title>

          <div className="space-y-4">
            {node.contentInside?.map((child, i) => (
              <RenderNode
                key={i}
                node={child}
                path={[...path, i]}
              />
            ))}
          </div>
        </Card>
      );

    case "subtitle":
      return (
        <Card className="ml-6 bg-gray-50 border border-gray-200">
          <Title level={5} className="!mb-2">
            {node.text}
          </Title>

          <div className="space-y-3">
            {node.contentInside?.map((child, i) => (
              <RenderNode
                key={i}
                node={child}
                path={[...path, i]}
              />
            ))}
          </div>
        </Card>
      );

    case "text":
      return (
        <Form.Item
          className="ml-6"
          name={["data", ...path]}
        >
          <Input.TextArea
            autoSize
            className="resize-none"
          />
        </Form.Item>
      );

    case "table":
      return <EditableTable rows={node.rows} />;

    default:
      return null;
  }
}
