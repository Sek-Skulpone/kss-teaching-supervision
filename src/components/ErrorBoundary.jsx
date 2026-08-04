import React from 'react';

// Catches render-time errors anywhere below it so a single bad state doesn't
// blank the whole screen with no way to recover.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled error caught by ErrorBoundary:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          padding: '24px',
          textAlign: 'center',
          fontFamily: 'inherit'
        }}>
          <h2>เกิดข้อผิดพลาดที่ไม่คาดคิด</h2>
          <p>กรุณาลองโหลดหน้าใหม่อีกครั้ง หากยังพบปัญหาโปรดติดต่อผู้ดูแลระบบ</p>
          <button
            onClick={this.handleReset}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: '#2563eb',
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            โหลดหน้าใหม่
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
