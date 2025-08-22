import {
  createUser,
  getUserByEmail,
  getUserById,
  /*getUsers, 
  updateUser,
  deleteUser,
  searchUsers*/
} from "../services/authService.js";

// Cadastrar usuário
export const signup = async (req, res) => {
  try {
    const { cnpj, email, password } = req.body;
    // Validação básica
    if (!cnpj || !email || !password) {
      return res.status(400).json({
        success: false,
        error: "Todos os campos são obrigatórios."
      });
    }
    // Verifica se o usuário já existe
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: "E-mail já cadastrado."
      });
    }
    // Cria usuário
    const userData = { cnpj, email, password };
    const newUser = await createUser(userData);
    res.status(201).json({
      success: true,
      user: newUser
    });
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Login de usuário 
export const signin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await getUserByEmail(email);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Usuário não encontrado"
      });
    }

    // Verifica senha
    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        error: "Senha incorreta"
      });
    }

    // Salvar na sessão - DADOS COMPLETOS DO USUÁRIO
    req.session.userId = user.uuid;
    req.session.user = {
      uuid: user.uuid,
      email: user.email,
      cnpj: user.cnpj,
      company_name: user.company_name,
      owner_name: user.owner_name,
      color: user.color,
      accessibility: user.accessibility,
      features: user.features
    };

    console.log('=== SALVANDO SESSÃO ===');
    console.log('Session ID antes:', req.sessionID);
    console.log('Dados salvos:', req.session.user);

    // Force salvar a sessão e aguarde
    await new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) {
          console.error('Erro ao salvar sessão:', err);
          reject(err);
        } else {
          console.log('Sessão salva com sucesso!');
          console.log('Session ID após salvar:', req.sessionID);
          resolve();
        }
      });
    });

    // Remove senha da resposta
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      user: userWithoutPassword,
      debug: {
        sessionId: req.sessionID,
        userId: req.session.userId,
        cookieConfig: {
          secure: req.session.cookie.secure,
          sameSite: req.session.cookie.sameSite,
          httpOnly: req.session.cookie.httpOnly
        }
      }
    });

  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor"
    });
  }
};

// checkSession melhorado
export const checkSession = async (req, res) => {
  try {
    console.log('=== VERIFICANDO SESSÃO ===');
    console.log('Session ID:', req.sessionID);
    console.log('Cookies recebidos:', req.headers.cookie);
    console.log('Session keys:', Object.keys(req.session));
    console.log('UserID na sessão:', req.session.userId);
    console.log('User na sessão:', req.session.user);

    if (req.session && req.session.userId) {
      // Se temos userId mas não temos user completo, tente carregar do banco
      if (!req.session.user) {
        console.log('Carregando dados do usuário do banco...');
        const user = await getUserById(req.session.userId);
        if (user) {
          req.session.user = {
            uuid: user.uuid,
            email: user.email,
            cnpj: user.cnpj,
            company_name: user.company_name,
            owner_name: user.owner_name,
            color: user.color,
            accessibility: user.accessibility,
            features: user.features
          };

          // Salvar sessão atualizada
          await new Promise((resolve) => {
            req.session.save(() => resolve());
          });
        }
      }

      res.status(200).json({
        success: true,
        user: req.session.user,
        debug: {
          sessionId: req.sessionID,
          userId: req.session.userId,
          hasUserInSession: !!req.session.user
        }
      });
    } else {
      console.log('Sessão inválida - userId não encontrado');
      res.status(401).json({
        success: false,
        error: "Sessão não encontrada",
        debug: {
          sessionId: req.sessionID,
          sessionKeys: Object.keys(req.session),
          hasUserId: !!req.session.userId
        }
      });
    }
  } catch (error) {
    console.error("Erro ao verificar sessão:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor"
    });
  }
};

// Obtem os dados da sessão do usuário para salvar no Redux
export const getSession = async (req, res) => {
  try {
    console.log('Obtendo sessão completa para ID:', req.sessionID);

    if (req.session && req.session.user) {
      const userId = req.session.user.id || req.session.user.uuid || req.session.user._id;

      if (!userId) {
        console.error('ID do usuário não encontrado na sessão');
        return res.status(400).json({
          success: false,
          error: "ID do usuário não encontrado na sessão"
        });
      }

      console.log('Buscando usuário no banco com ID:', userId);
      const user = await getUserById(userId);

      if (!user) {
        console.error('Usuário não encontrado no banco para ID:', userId);
        return res.status(404).json({
          success: false,
          error: "Usuário não encontrado"
        });
      }

      console.log('Usuário encontrado:', user.email);
      return res.status(200).json({
        success: true,
        user
      });
    }

    console.log('Nenhuma sessão encontrada na requisição');
    return res.status(401).json({
      success: false,
      error: "Sessão não encontrada"
    });

  } catch (error) {
    console.error("Erro ao obter sessão:", error);
    return res.status(500).json({
      success: false,
      error: "Erro ao obter sessão"
    });
  }
};



export const logout = (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.error("Erro ao destruir sessão:", err);
        return res.status(500).json({
          success: false,
          error: "Erro ao fazer logout"
        });
      }

      res.clearCookie('connect.sid');
      res.status(200).json({
        success: true,
        message: "Logout realizado com sucesso"
      });
    });
  } catch (error) {
    console.error("Erro no logout:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor"
    });
  }
};

//Google Login
export const sucessGoogleLogin = (req, res) => {
  if (!req.user) {
    res.redirect("/failure");
  }
  console.log("Usuário autenticado com sucesso:", req.user);
  res.status(200).json({
    message: "Usuário autenticado com sucesso",
    user: req.user,
  });
};
export const failureGoogleLogin = (req, res) => {
  console.error("Falha na autenticação do Google:", req.query);
  res.status(401).json({ error: "Falha na autenticação do Google" });
};







/*
export const fetchUsers = async (req, res) => {
  try {
    const users = await getUsers();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const fetchUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await getUserById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



export const modifyUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const updatedUser = await updateUser(id, updates);
    if (!updatedUser || updatedUser.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const removeUser = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteUser(id);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const findUsers = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: "Search query is required" });
    }
    const users = await searchUsers(query);
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
*/