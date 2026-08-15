import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RepoLogo } from "@/entities/repo/ui/RepoLogo";

describe("RepoLogo", () => {
  it("기본 크기는 16px이다", () => {
    render(<RepoLogo src="https://avatars.example/1" alt="" />);
    const image = screen.getByRole("presentation");
    expect(image).toHaveAttribute("src", "https://avatars.example/1");
    expect(image).toHaveAttribute("width", "16");
    expect(image).toHaveAttribute("height", "16");
    expect(image).toHaveStyle({ width: "16px", height: "16px" });
  });

  it("크기를 지정할 수 있다", () => {
    render(<RepoLogo src="https://avatars.example/2" alt="" size={14} />);
    expect(screen.getByRole("presentation")).toHaveAttribute("width", "14");
  });

  it("설명이 있으면 이름으로 찾을 수 있다", () => {
    render(<RepoLogo src="https://avatars.example/3" alt="vercel 로고" />);
    expect(screen.getByAltText("vercel 로고")).toBeInTheDocument();
  });

  it("느리게 불러온다", () => {
    render(<RepoLogo src="https://avatars.example/4" alt="" />);
    expect(screen.getByRole("presentation")).toHaveAttribute("loading", "lazy");
  });
});
