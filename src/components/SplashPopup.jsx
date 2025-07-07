
import SplashCursor from '../animations/SplashCursor/SplashCursor';

export default function SplashPopup({ onClose }) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {/* Background Image - Fullscreen */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1,
          backgroundImage: 'url(https://picsum.photos/1900/1080)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          filter: 'blur(6px)',
          opacity: 0.2,
        }}
      />

      {/* SplashCursor on top */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 2,
          pointerEvents: 'all'
        }}
      >
        <SplashCursor
          SPLAT_RADIUS={0.5}
          PRESSURE_ITERATIONS={20}
          VELOCITY_DISSIPATION={0.2}
          DENSITY_DISSIPATION={2}
          CURL={1}
        />
      </div>

      {/* Close button */}
      <button
        onClick={() => onClose()}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 3,
          padding: '10px 20px',
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          color: 'white',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '5px',
          cursor: 'pointer',
          backdropFilter: 'blur(10px)',
          fontSize: '16px',
          fontWeight: 'bold'
        }}
      >
        Close
      </button>
    </div>
  )
}