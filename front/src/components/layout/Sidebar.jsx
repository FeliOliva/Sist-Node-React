// src/components/layout/MainLayout.jsx
import React, { useState } from "react";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  DollarOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { Layout, Menu, Button, theme } from "antd";
import { Link, Outlet, useLocation } from "react-router-dom";

const { Header, Sider, Content } = Layout;

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const location = useLocation();

  const getHeaderTitle = () => {
    switch (location.pathname) {
      case "/clientes":
        return "Clientes";
      case "/ventas":
        return "Ventas";
      default:
        return "";
    }
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div
          style={{
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "start",
            padding: collapsed ? "0" : "0 16px",
            color: "#fff",
            fontSize: 18,
            fontWeight: "bold",
            gap: 18,
          }}
        >
          <img src="/logo.png" alt="Logo" style={{ width: 30, height: 30 }} />
          {!collapsed && <span style={{ whiteSpace: "nowrap" }}>Mi familia</span>}
        </div>
        <div className="demo-logo-vertical" />
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
        >
          <Menu.Item key="/clientes" icon={<UserOutlined />}>
            <Link to="/clientes">Clientes</Link>
          </Menu.Item>
          <Menu.Item key="/ventas" icon={<DollarOutlined />}>
            <Link to="/ventas">Ventas</Link>
          </Menu.Item>
        </Menu>
        <Menu theme="dark" mode="inline">
          <Menu.Item
            key="logout"
            icon={<LogoutOutlined />}
            onClick={() => {
              localStorage.removeItem("token");
              window.location.href = "/login";
            }}
          >
            Cerrar sesión
          </Menu.Item>
        </Menu>
      </Sider>
      <Layout>
        <Header style={{ padding: "0", background: colorBgContainer, display: "flex", alignItems: "center", gap: "10px" }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: "16px",
              width: 50,
              height: 64,
            }}
          />
          <h1 className="text-2xl font-roboto m-0">{getHeaderTitle()}</h1>
        </Header>
        <Content
          style={{
            margin: "24px 16px",
            padding: 24,
            minHeight: 280,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
