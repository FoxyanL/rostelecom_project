"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

export default function Home() {
  const { address: connectedAddress } = useAccount();
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  // Получаем количество вариантов
  const { data: optionsCount } = useScaffoldReadContract({
    contractName: "Voting",
    functionName: "getOptionsCount",
  });

  // Получаем все варианты с результатами
  const { data: allOptions, refetch: refetchOptions } = useScaffoldReadContract({
    contractName: "Voting",
    functionName: "getAllOptions",
  });

  // Проверяем, голосовал ли текущий пользователь
  const { data: hasVoted, refetch: refetchVotedStatus } = useScaffoldReadContract({
    contractName: "Voting",
    functionName: "checkIfVoted",
    args: [connectedAddress],
  });

  const { writeContractAsync, isPending } = useScaffoldWriteContract("Voting");

  // Обновляем данные после голосования
  useEffect(() => {
    const interval = setInterval(() => {
      refetchOptions();
      refetchVotedStatus();
    }, 3000);
    return () => clearInterval(interval);
  }, [refetchOptions, refetchVotedStatus]);

  const handleVote = async (optionIndex: number) => {
    try {
      await writeContractAsync({
        functionName: "vote",
        args: [BigInt(optionIndex)],
      });

      // Обновляем данные после успешного голосования
      setTimeout(() => {
        refetchOptions();
        refetchVotedStatus();
      }, 1000);
    } catch (error) {
      console.error("Ошибка при голосовании:", error);
    }
  };

  const options = allOptions ? allOptions[0] : [];
  const votes = allOptions ? allOptions[1] : [];
  const totalVotes = votes ? votes.reduce((acc, v) => acc + Number(v), 0) : 0;

  return (
    <div className="flex items-center flex-col flex-grow pt-10">
      <div className="px-5 w-full max-w-4xl">
        <h1 className="text-center mb-8">
          <span className="block text-4xl font-bold">Децентрализованная система голосования</span>
          <span className="block text-2xl mt-2 text-gray-500">на базе Ethereum</span>
        </h1>

        {!connectedAddress ? (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 text-center">
            <p className="text-lg font-medium text-yellow-800">Подключите кошелёк MetaMask для участия в голосовании</p>
          </div>
        ) : hasVoted ? (
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 text-center mb-6">
            <p className="text-lg font-medium text-green-800">✓ Вы уже проголосовали. Спасибо за участие!</p>
          </div>
        ) : (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 text-center mb-6">
            <p className="text-lg font-medium text-blue-800">Выберите вариант и проголосуйте</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 mb-8">
          {options.map((optionName: string, index: number) => {
            const voteCount = votes[index] ? Number(votes[index]) : 0;
            const percentage = totalVotes > 0 ? ((voteCount / totalVotes) * 100).toFixed(1) : "0";
            const isSelected = selectedOption === index;

            return (
              <div
                key={index}
                className={`relative border-2 rounded-lg p-6 transition-all ${
                  isSelected ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-white"
                } ${!hasVoted && connectedAddress ? "hover:border-blue-400 cursor-pointer" : ""}`}
                onClick={() => {
                  if (!hasVoted && connectedAddress) {
                    setSelectedOption(index);
                  }
                }}
              >
                {/* Прогресс-бар */}
                <div
                  className="absolute inset-0 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg opacity-30"
                  style={{ width: `${percentage}%`, transition: "width 0.5s ease-in-out" }}
                />

                <div className="relative z-10 flex justify-between items-center">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">{optionName}</h3>
                    <div className="flex items-center gap-4">
                      <span className="text-3xl font-bold text-blue-600">{voteCount}</span>
                      <span className="text-gray-600">голосов ({percentage}%)</span>
                    </div>
                  </div>

                  {!hasVoted && connectedAddress && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleVote(index);
                      }}
                      disabled={isPending}
                      className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                        isSelected
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isPending ? "Отправка..." : "Голосовать"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Статистика */}
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <h2 className="text-2xl font-bold mb-4">Статистика голосования</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <p className="text-gray-600 text-sm">Всего вариантов</p>
              <p className="text-3xl font-bold text-blue-600">{optionsCount?.toString() || "0"}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <p className="text-gray-600 text-sm">Всего голосов</p>
              <p className="text-3xl font-bold text-purple-600">{totalVotes}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <p className="text-gray-600 text-sm">Ваш статус</p>
              <p className="text-lg font-semibold text-green-600 mt-2">
                {!connectedAddress ? "Не подключен" : hasVoted ? "Проголосовал" : "Не голосовал"}
              </p>
            </div>
          </div>
        </div>

        {/* Информация о проекте */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
          <h2 className="text-xl font-bold mb-3">О проекте</h2>
          <p className="text-gray-700 mb-2">
            Децентрализованная система голосования на базе блокчейна Ethereum обеспечивает:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            <li>Прозрачность — все голоса записаны в блокчейн</li>
            <li>Безопасность — невозможность изменения результатов</li>
            <li>Справедливость — один адрес = один голос</li>
            <li>Децентрализация — отсутствие центрального сервера</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
