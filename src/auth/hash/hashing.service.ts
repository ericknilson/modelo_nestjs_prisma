// Uma class abstrata apenas para servir como um TIPO
export abstract class HashingServiceProtocol {
  abstract hash(password: string): Promise<string>;

  abstract compare(
    loginPassword: string,
    userPassword: string,
  ): Promise<boolean>;
}
