import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setUser, setLoading, logout } from '../store/reducers/userSlice';
import { getMe } from '../services/auth.service';
import api from '../services/api';

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, token, isLoading } = useSelector((state) => state.user);
  const prevTokenRef = useRef(token);

  useEffect(() => {
    if (token === prevTokenRef.current) return;
    prevTokenRef.current = token;

    const loadUser = async () => {
      if (token) {
        try {
          dispatch(setLoading(true));
          const res = await getMe();
          // res.data = { success: true, user }
          dispatch(setUser({ user: res.data.user, token }));
        } catch (err) {
          dispatch(logout());
        } finally {
          dispatch(setLoading(false));
        }
      } else {
        dispatch(setLoading(false));
      }
    };
    loadUser();
  }, [token, dispatch]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    // res.data = { success: true, token, user }
    dispatch(setUser(res.data));
  };

  const logoutUser = () => {
    dispatch(logout());
  };

  return { user, token, isLoading, login, logout: logoutUser };
};