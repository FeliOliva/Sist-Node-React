import React, { useState, useEffect } from "react";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  DollarOutlined,
  LogoutOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { Layout, Menu, Button, theme, Drawer } from "antd";
import { Link, Outlet, useLocation } from "react-router-dom";

const { Header, Sider, Content } = Layout;

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const location = useLocation();

  // Detectar si es dispositivo móvil
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth <= 768) {
        setCollapsed(true);
      }
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);

    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);

  const getHeaderTitle = () => {
    switch (location.pathname) {
      case "/clientes":
        return "Clientes";
      case "/ventas":
        return "Ventas";
      case "/productos":
        return "Productos";
      default:
        return "";
    }
  };

  // Componente del menú principal
  const MainMenuItems = () => (
    <Menu theme="dark" mode="inline" selectedKeys={[location.pathname]}>
      <Menu.Item key="/clientes" icon={<UserOutlined />}>
        <Link
          to="/clientes"
          onClick={() => isMobile && setMobileDrawerOpen(false)}
        >
          Clientes
        </Link>
      </Menu.Item>
      <Menu.Item key="/ventas" icon={<DollarOutlined />}>
        <Link
          to="/ventas"
          onClick={() => isMobile && setMobileDrawerOpen(false)}
        >
          Ventas
        </Link>
      </Menu.Item>
      <Menu.Item key="/productos" icon={<DollarOutlined />}>
        <Link
          to="/productos"
          onClick={() => isMobile && setMobileDrawerOpen(false)}
        >
          Productos
        </Link>
      </Menu.Item>
    </Menu>
  );

  // Componente para el botón de logout (footer)
  const LogoutButton = () => (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        width: "100%",
        borderTop: "1px solid rgba(255,255,255,0.1)",
        paddingBottom: "10px",
      }}
    >
      <Menu theme="dark" mode="inline" selectable={false}>
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
    </div>
  );

  // Logo Component
  const LogoComponent = ({ collapsed }) => (
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
  );

  // Contenido del sidebar, tanto para desktop como para móvil
  const SidebarContent = ({ collapsed = false }) => (
    <div style={{ position: "relative", height: "100%" }}>
      <LogoComponent collapsed={collapsed} />
      <div className="demo-logo-vertical" />
      <div style={{ height: "calc(100% - 130px)", overflowY: "auto" }}>
        <MainMenuItems />
      </div>
      <LogoutButton />
    </div>
  );

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Sidebar para desktop */}
      {!isMobile && (
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={200}
          style={{ overflow: "hidden" }}
        >
          <SidebarContent collapsed={collapsed} />
        </Sider>
      )}

      {/* Drawer para móviles */}
      {isMobile && (
        <Drawer
          placement="left"
          closable={true}
          onClose={() => setMobileDrawerOpen(false)}
          open={mobileDrawerOpen}
          bodyStyle={{ padding: 0, backgroundColor: "#001529", height: "100%" }}
          headerStyle={{ backgroundColor: "#001529", border: "none" }}
          closeIcon={<CloseOutlined style={{ color: "#fff" }} />}
          width={200}
        >
          <SidebarContent collapsed={false} />
        </Drawer>
      )}

      <Layout>
        <Header
          style={{
            padding: "0",
            background: colorBgContainer,
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <Button
            type="text"
            icon={
              isMobile ? (
                <MenuUnfoldOutlined />
              ) : collapsed ? (
                <MenuUnfoldOutlined />
              ) : (
                <MenuFoldOutlined />
              )
            }
            onClick={() => {
              if (isMobile) {
                setMobileDrawerOpen(true);
              } else {
                setCollapsed(!collapsed);
              }
            }}
            style={{
              fontSize: "16px",
              width: 50,
              height: 64,
            }}
          />
          <h1
            style={{
              fontSize: isMobile ? "1.25rem" : "1.5rem",
              margin: 0,
              fontFamily: "Roboto, sans-serif",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {getHeaderTitle()}
          </h1>
        </Header>
        <Content
          style={{
            margin: isMobile ? "12px 8px" : "24px 16px",
            padding: isMobile ? 16 : 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
