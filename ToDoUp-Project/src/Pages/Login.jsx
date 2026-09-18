import { SignIn } from "@clerk/clerk-react";

function Login() {
  return (
    <div className="userac-reset userac-page">
      <div className="userac-grid">
        <div className="userac-brand-panel">
          <div className="userac-brand-name">ToDoUp</div>
          <div>
            <h1 className="userac-brand-tagline">
              Organize your work.
              <br />
              <span>Get things done.</span>
            </h1>
            <p className="userac-brand-desc">
              A project management workspace.
              Create boards, build lists, move cards.
            </p>
          </div>
        </div>
       
        <div className="userac-auth-panel">
          <SignIn afterSignInUrl="/dashboard" />
        </div>
      </div>
    </div>
  );
}

export default Login;