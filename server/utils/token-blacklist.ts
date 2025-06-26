/**
 * Sistema simples de blacklist de tokens em memória
 * Em produção, considere usar Redis ou outro sistema de cache distribuído
 */

interface BlacklistedToken {
  token: string;
  userId: number;
  expiresAt: Date;
  blacklistedAt: Date;
}

class TokenBlacklist {
  private blacklist: Map<string, BlacklistedToken> = new Map();
  
  /**
   * Adiciona um token à blacklist
   */
  add(token: string, userId: number, expiresAt: Date): void {
    this.blacklist.set(token, {
      token,
      userId,
      expiresAt,
      blacklistedAt: new Date()
    });
    
    console.log(`🚫 Token adicionado à blacklist para usuário ${userId}`);
    
    // Limpar tokens expirados periodicamente
    this.cleanup();
  }
  
  /**
   * Verifica se um token está na blacklist
   */
  isBlacklisted(token: string): boolean {
    const entry = this.blacklist.get(token);
    
    if (!entry) {
      return false;
    }
    
    // Se o token já expirou naturalmente, removê-lo da blacklist
    if (new Date() > entry.expiresAt) {
      this.blacklist.delete(token);
      return false;
    }
    
    return true;
  }
  
  /**
   * Remove tokens expirados da blacklist
   */
  private cleanup(): void {
    const now = new Date();
    const expiredTokens: string[] = [];
    
    for (const [token, entry] of this.blacklist.entries()) {
      if (now > entry.expiresAt) {
        expiredTokens.push(token);
      }
    }
    
    expiredTokens.forEach(token => {
      this.blacklist.delete(token);
    });
    
    if (expiredTokens.length > 0) {
      console.log(`🧹 Removidos ${expiredTokens.length} tokens expirados da blacklist`);
    }
  }
  
  /**
   * Limpa todos os tokens de um usuário específico
   */
  clearUserTokens(userId: number): void {
    const userTokens: string[] = [];
    
    for (const [token, entry] of this.blacklist.entries()) {
      if (entry.userId === userId) {
        userTokens.push(token);
      }
    }
    
    userTokens.forEach(token => {
      this.blacklist.delete(token);
    });
    
    if (userTokens.length > 0) {
      console.log(`🧹 Removidos ${userTokens.length} tokens do usuário ${userId} da blacklist`);
    }
  }
  
  /**
   * Retorna estatísticas sobre a blacklist
   */
  getStats(): { total: number; byUser: Map<number, number> } {
    const byUser = new Map<number, number>();
    
    for (const entry of this.blacklist.values()) {
      const count = byUser.get(entry.userId) || 0;
      byUser.set(entry.userId, count + 1);
    }
    
    return {
      total: this.blacklist.size,
      byUser
    };
  }
}

// Instância única da blacklist
export const tokenBlacklist = new TokenBlacklist();

// Executar limpeza a cada 15 minutos
setInterval(() => {
  const stats = tokenBlacklist.getStats();
  console.log(`📊 Token Blacklist: ${stats.total} tokens na lista`);
}, 15 * 60 * 1000);