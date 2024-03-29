import type { Algorithm, AlgorithmOptions, CubeEvent, IPC, ContestPDFOptions, Session, Sheet, Solve, Tutorial, UpdateCommand, PDFOptions, IStorageInfo, ICacheDB } from "@interfaces";

export class ElectronAdaptor implements IPC {
  private ipc: IPC;
  constructor() {
    this.ipc = (<any> window).electronAPI as IPC;
  }

  async getAlgorithms(options: AlgorithmOptions): Promise<Algorithm[]> {
    return await this.ipc.getAlgorithms(options);
  }

  addDownloadProgressListener(cb: any) {
    this.ipc.addDownloadProgressListener(cb);
  }

  addDownloadDoneListener(cb: any) {
    this.ipc.addDownloadDoneListener(cb);
  }

  addBluetoothListener(cb: any) {
    this.ipc.addBluetoothListener(cb);
  }

  updateAlgorithm(alg: Algorithm) {
    let cp = { ...alg };

    delete cp._puzzle;

    return this.ipc.updateAlgorithm(cp);
  }

  addAlgorithm(alg: Algorithm) {
    let cp = { ...alg };
    delete cp._puzzle;
    return this.ipc.addAlgorithm(cp);
  }

  removeAlgorithm(alg: Algorithm) {
    let cp = { ...alg };
    delete cp._puzzle;
    return this.ipc.removeAlgorithm(cp);
  }

  getTutorials() {
    return this.ipc.getTutorials();
  }

  addTutorial(t: Tutorial) {
    return this.ipc.addTutorial(t);
  }

  updateTutorial(t: Tutorial) {
    return this.ipc.updateTutorial(t);
  }

  getSolves() {
    return this.ipc.getSolves();
  }

  addSolve(s: Solve) {
    return this.ipc.addSolve(s);
  }

  addSolves(s: Solve[]) {
    return this.ipc.addSolves(s);
  }

  updateSolve(s: Solve) {
    return this.ipc.updateSolve(s);
  }

  removeSolves(s: Solve[]) {
    return this.ipc.removeSolves(s);
  }

  getSessions() {
    return this.ipc.getSessions();
  }

  addSession(s: Session) {
    return this.ipc.addSession(s);
  }

  removeSession(s: Session) {
    return this.ipc.removeSession(s);
  }

  renameSession(s: Session) {
    return this.ipc.renameSession(s);
  }

  updateSession(s: Session) {
    return this.ipc.updateSession(s);
  }

  addContest(c: CubeEvent) {
    return this.ipc.addContest(c);
  }

  getContests() {
    return this.ipc.getContests();
  }

  updateContest(c: CubeEvent) {
    return this.ipc.updateContest(c);
  }

  removeContests(c: CubeEvent[]) {
    return this.ipc.removeContests(c);
  }

  minimize() {
    return this.ipc.minimize();
  }

  maximize() {
    return this.ipc.maximize();
  }

  close() {
    return this.ipc.close();
  }

  generatePDF(args: PDFOptions) {
    return this.ipc.generatePDF(args);
  }

  generateContestPDF(args: ContestPDFOptions) {
    return this.ipc.generateContestPDF(args);
  }

  zipPDF(s: { name: string, files: Sheet[]}) {
    return this.ipc.zipPDF(s);
  }

  openFile(f: string) {
    return this.ipc.openFile(f);
  }

  revealFile(f: string) {
    return this.ipc.revealFile(f);
  }

  update(cmd: UpdateCommand) {
    return this.ipc.update(cmd);
  }
  
  cancelUpdate() {
    return this.ipc.cancelUpdate();
  }

  sleep(s: boolean) {
    return this.ipc.sleep(s);
  }

  connectBluetoothDevice(id: string) {
    return this.ipc.connectBluetoothDevice(id);
  }

  cancelBluetoothRequest() {
    return this.ipc.cancelBluetoothRequest();
  }

  pairingBluetoothResponse() {
    return this.ipc.pairingBluetoothResponse();
  }

  cacheCheckImage(hash: string): Promise<boolean> {
    return this.ipc.cacheCheckImage(hash);
  }

  cacheGetImage(hash: string): Promise<string> {
    return this.ipc.cacheGetImage(hash);
  }

  cacheGetImageBundle(hashes: string[]): Promise<string[]> {
    return this.ipc.cacheGetImageBundle(hashes);
  }

  cacheSaveImage(hash: string, data: string): Promise<void> {
    return this.ipc.cacheSaveImage(hash, data);
  }

  clearCache(db: ICacheDB) {
    // Implement this
    return Promise.resolve();
  }

  getStorageInfo(): Promise<IStorageInfo> {
    return Promise.resolve({
      algorithms: 0,
      cache: 0,
      sessions: 0,
      solves: 0,
      tutorials: 0
    });
  }

  getAllDisplays() {
    return this.ipc.getAllDisplays();
  }

  useDisplay(id: number) {
    return this.ipc.useDisplay(id);
  }

  addExternalConnector(cb: any) {
    this.ipc.addExternalConnector(cb);
  }

  external(device: string, ...args: any[]) {
    this.ipc.external(device, ...args);
  }
}