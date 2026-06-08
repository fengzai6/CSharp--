import { StyleProvider } from "@ant-design/cssinjs";
import { ConfigProvider } from "antd";
import { Outlet } from "react-router";

function App() {
  return (
    <StyleProvider layer>
      <ConfigProvider
        theme={{
          token: {
            borderRadius: 8,
            colorPrimary: "#0f766e",
            colorSuccess: "#047857",
            colorWarning: "#d97706",
            fontFamily:
              'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          },
        }}
      >
        <Outlet />
      </ConfigProvider>
    </StyleProvider>
  );
}

export default App;
