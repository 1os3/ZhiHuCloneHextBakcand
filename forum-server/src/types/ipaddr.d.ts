declare module 'ipaddr.js' {
  export interface IPv4 {
    kind(): string;
    toString(): string;
    toByteArray(): number[];
    match(other: IPv4, bits: number): boolean;
    range(): string;
    subnetMatch(rangeList: Array<[IPv4, number]>, defaultName: string): string;
    octets: number[];
  }

  export interface IPv6 {
    kind(): string;
    toString(): string;
    toByteArray(): number[];
    match(other: IPv6, bits: number): boolean;
    range(): string;
    subnetMatch(rangeList: Array<[IPv6, number]>, defaultName: string): string;
    parts: number[];
  }

  export function parse(ip: string): IPv4 | IPv6;
  export function parseCIDR(cidr: string): [IPv4 | IPv6, number];
  export function fromByteArray(bytes: number[]): IPv4 | IPv6;
  export function process(ip: string): IPv4 | IPv6;
  export function isValid(ip: string): boolean;
  export function isValidCIDR(cidr: string): boolean;
}
