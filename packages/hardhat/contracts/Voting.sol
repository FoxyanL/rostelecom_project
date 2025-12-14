// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Voting
 * @dev Смарт-контракт для децентрализованного голосования
 * @notice Позволяет пользователям голосовать за один из предложенных вариантов
 */
contract Voting {
    struct Option {
        string name;
        uint256 votes;
    }

    Option[] public options;
    mapping(address => bool) public hasVoted;
    
    event Voted(address indexed voter, uint256 indexed optionIndex, string optionName);
    event VotingCreated(uint256 optionsCount);

    /**
     * @dev Конструктор создаёт новое голосование с заданными вариантами
     * @param _options Массив названий вариантов для голосования
     */
    constructor(string[] memory _options) {
        require(_options.length > 0, "At least one option required");
        
        for (uint i = 0; i < _options.length; i++) {
            require(bytes(_options[i]).length > 0, "Option name cannot be empty");
            options.push(Option({
                name: _options[i],
                votes: 0
            }));
        }
        
        emit VotingCreated(_options.length);
    }

    /**
     * @dev Позволяет пользователю проголосовать за выбранный вариант
     * @param optionIndex Индекс варианта для голосования
     */
    function vote(uint256 optionIndex) external {
        require(!hasVoted[msg.sender], "You already voted");
        require(optionIndex < options.length, "Invalid option");

        hasVoted[msg.sender] = true;
        options[optionIndex].votes += 1;
        
        emit Voted(msg.sender, optionIndex, options[optionIndex].name);
    }

    /**
     * @dev Возвращает количество вариантов голосования
     * @return Количество вариантов
     */
    function getOptionsCount() external view returns (uint256) {
        return options.length;
    }
    
    /**
     * @dev Возвращает информацию о конкретном варианте
     * @param index Индекс варианта
     * @return name Название варианта
     * @return votes Количество голосов
     */
    function getOption(uint256 index) external view returns (string memory name, uint256 votes) {
        require(index < options.length, "Invalid option index");
        Option memory option = options[index];
        return (option.name, option.votes);
    }
    
    /**
     * @dev Возвращает все варианты голосования с результатами
     * @return names Массив названий вариантов
     * @return voteCounts Массив количества голосов
     */
    function getAllOptions() external view returns (string[] memory names, uint256[] memory voteCounts) {
        names = new string[](options.length);
        voteCounts = new uint256[](options.length);
        
        for (uint256 i = 0; i < options.length; i++) {
            names[i] = options[i].name;
            voteCounts[i] = options[i].votes;
        }
        
        return (names, voteCounts);
    }
    
    /**
     * @dev Проверяет, голосовал ли указанный адрес
     * @param voter Адрес для проверки
     * @return true если адрес уже проголосовал
     */
    function checkIfVoted(address voter) external view returns (bool) {
        return hasVoted[voter];
    }
}
