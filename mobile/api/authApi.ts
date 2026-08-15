export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponse = {
  success: boolean;
  message?: string;
  token?: string;
  user?: {
    id: string;
    email: string;
    username?: string;
    phone?: string;
  };
};

export type SignupPayload = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
};

export type SignupResponse = {
  success: boolean;
  message?: string;
  token?: string;
  user?: {
    id: string;
    username: string;
    email: string;
    phone?: string;
  };
};

/* =========================================================
   API BASE URL
========================================================= */

// เปลี่ยนตรงนี้เมื่อ Backend พร้อม
const API_BASE_URL = 'http://172.20.10.2:3000';

/* =========================================================
   LOGIN
========================================================= */

export async function loginUser(
  payload: LoginPayload
): Promise<LoginResponse> {
  const response = await fetch(
    '${API_BASE_URL}/auth/login',
    {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
      },

      body: JSON.stringify({
        email: payload.email.trim(),
        password: payload.password,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.message ||
        'Unable to login. Please try again.'
    );
  }

  return data;
}

/* =========================================================
   SIGN UP
========================================================= */

export async function signupUser(
  payload: SignupPayload
): Promise<SignupResponse> {
  const response = await fetch(
    '${API_BASE_URL}/auth/register',
    {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
      },

      body: JSON.stringify({
        username: payload.username.trim(),
        email: payload.email.trim(),
        password: payload.password,
        confirmPassword: payload.confirmPassword,
        phone: payload.phone.trim(),
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.message ||
        'Unable to create account.'
    );
  }

  return data;
}

/* =========================================================
   FORGOT PASSWORD
========================================================= */

export async function forgotPassword(
  email: string
) {
  const response = await fetch(
    '${API_BASE_URL}/auth/forgot-password',
    {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
      },

      body: JSON.stringify({
        email: email.trim(),
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.message ||
        'Unable to send reset email.'
    );
  }

  return data;
}
