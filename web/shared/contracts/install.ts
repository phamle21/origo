/** Whether the first-run install screen is still open, and whether it needs the server's install code. */
export interface InstallStatus {
  isInstalled: boolean;
  /** Production servers ask for the INSTALL_TOKEN secret before creating the first administrator. */
  isTokenRequired: boolean;
  /** False when a token is required but the server has none set: only the command line can install. */
  isTokenConfigured: boolean;
}

export interface InstallRequest {
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
  token: string;
}
